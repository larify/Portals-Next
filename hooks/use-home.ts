'use client';

import type { Dispatch, RefObject, SetStateAction } from 'react';
import { useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { HomeContext } from '@/lib/client/home/context';
import { loadHomeResources } from '@/lib/client/home/resources';
import { createSpaceRenderer } from '@/lib/client/home/space-renderer';
import { HOME_SCENE_CONFIG } from '@/lib/constants/home';
import type { RouteType } from '@/lib/constants/routes';
import { ROUTE_TYPE, ROUTE_TYPES } from '@/lib/constants/routes';

const MODES = [...ROUTE_TYPES, ROUTE_TYPE.SUBSCRIPTION];
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

type HomeInteraction = {
  turns: number;
};

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION);

  media.addEventListener('change', onChange);

  return () => media.removeEventListener('change', onChange);
}

function getReducedMotion() {
  return window.matchMedia(REDUCED_MOTION).matches;
}

function getServerReducedMotion() {
  return true;
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

export function useHome() {
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const carousel = useHomeCarousel(step, setStep, ready);
  const canvas = useHomeCanvas(step, carousel.reducedMotion, setReady, carousel.interactionRef);
  const label = useHomeLabel(carousel.active, carousel.reducedMotion, ready);

  return { ready, ...carousel, ...canvas, ...label };
}

export function useHomeScene() {
  const scene = useContext(HomeContext);

  if (!scene) {
    throw new Error('HomeSceneProvider is required');
  }

  return scene;
}

export function useHomeCarousel(step: number, setStep: Dispatch<SetStateAction<number>>, ready: boolean) {
  const [manualActive, setManualActive] = useState(false);
  const [carouselElement, setCarouselElement] = useState<HTMLElement | null>(null);
  const interactionRef = useRef<HomeInteraction>({ turns: 0 });
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, getReducedMotion, getServerReducedMotion);
  const active = MODES[wrapIndex(step, MODES.length)];

  useEffect(() => {
    if (!carouselElement || !ready) {
      return;
    }

    const element = carouselElement;
    const interaction = interactionRef.current;
    const events = new AbortController();

    type Swipe = {
      pointerId: number | null;
      x: number;
      y: number;
      switched: boolean;
    };

    let swipe: Swipe | null = null;
    let autoTimer: number | undefined;
    let scrollEndTimer: number | undefined;
    let wheelSample = { time: -Infinity, distance: 0, direction: 0, slowed: false };
    let autoVersion = 0;
    let disposed = false;
    const { autoplayInterval, wheelSettleDelay, swipeDistance, labelExitDuration, labelEnterDuration } =
      HOME_SCENE_CONFIG.presentation;

    function stopAuto() {
      autoVersion += 1;
      window.clearTimeout(autoTimer);
    }

    function scheduleAuto(afterSwitch = false) {
      stopAuto();

      if (disposed || reducedMotion || document.hidden || swipe) {
        return;
      }

      const version = autoVersion;

      autoTimer = window.setTimeout(
        () => {
          if (disposed || version !== autoVersion || swipe) {
            return;
          }

          setStep((current) => current + 1);
          scheduleAuto(true);
        },
        autoplayInterval + (afterSwitch ? labelExitDuration + labelEnterDuration : 0),
      );
    }

    function switchMode(offset: number) {
      interaction.turns -= offset;
      setStep((current) => current + offset);
    }

    function beginSwipe(pointerId: number | null = null, x = 0, y = 0) {
      stopAuto();
      setManualActive(true);
      swipe = { pointerId, x, y, switched: false };
    }

    function updateSwipe(dx: number, dy: number) {
      if (!swipe || swipe.switched) {
        return;
      }

      const distance = Math.abs(dx) > Math.abs(dy) ? dx : dy;

      if (Math.abs(distance) >= swipeDistance) {
        swipe.switched = true;
        switchMode(-Math.sign(distance));
      }
    }

    function endSwipe() {
      if (!swipe) {
        return;
      }

      const switched = swipe.switched;

      window.clearTimeout(scrollEndTimer);
      swipe = null;
      setManualActive(false);
      scheduleAuto(switched);
    }

    function isControl(target: EventTarget | null) {
      return target instanceof Element && Boolean(target.closest('button, a, input, textarea, select, [role="menu"]'));
    }

    function onWheel(event: globalThis.WheelEvent) {
      if (event.ctrlKey || (!event.deltaX && !event.deltaY) || isControl(event.target)) {
        return;
      }

      event.preventDefault();

      if (swipe && swipe.pointerId !== null) {
        return;
      }

      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1;
      const dx = event.deltaX * unit;
      const dy = event.deltaY * unit;
      const dominant = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      const distance = Math.abs(dominant);
      const direction = Math.sign(dominant);
      const now = performance.now();
      const paused = now - wheelSample.time >= wheelSettleDelay;
      const reversed = direction !== wheelSample.direction && distance >= 2;
      const accelerated =
        wheelSample.slowed && distance >= wheelSample.distance * 1.5 && distance - wheelSample.distance >= 2;
      const restarted = swipe?.switched && (reversed || accelerated);

      if (!swipe || paused || restarted) {
        beginSwipe();
      }

      wheelSample = {
        time: now,
        distance,
        direction,
        slowed: !paused && !restarted && (distance < wheelSample.distance || wheelSample.slowed),
      };

      const current = swipe;

      if (!current) {
        return;
      }

      current.x -= dx;
      current.y -= dy;
      updateSwipe(current.x, current.y);
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(endSwipe, wheelSettleDelay);
    }

    function onPointerDown(event: globalThis.PointerEvent) {
      if (event.pointerType === 'mouse' || !event.isPrimary || isControl(event.target) || swipe) {
        return;
      }

      beginSwipe(event.pointerId, event.clientX, event.clientY);
      element.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event: globalThis.PointerEvent) {
      if (swipe?.pointerId === event.pointerId) {
        updateSwipe(event.clientX - swipe.x, event.clientY - swipe.y);
      }
    }

    function onPointerUp(event: globalThis.PointerEvent) {
      onPointerMove(event);
      onPointerCancel(event);
    }

    function onPointerCancel(event: globalThis.PointerEvent) {
      if (swipe?.pointerId === event.pointerId) {
        endSwipe();
      }
    }

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || isControl(event.target) || swipe) {
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        stopAuto();
        switchMode(event.key === 'ArrowLeft' ? -1 : 1);
        scheduleAuto(true);
      }
    }

    function onVisibilityChange() {
      stopAuto();
      window.clearTimeout(scrollEndTimer);
      swipe = null;
      setManualActive(false);

      if (!document.hidden) {
        scheduleAuto();
      }
    }

    scheduleAuto();
    window.addEventListener('wheel', onWheel, { passive: false, capture: true, signal: events.signal });
    element.addEventListener('pointerdown', onPointerDown, { signal: events.signal });
    window.addEventListener('pointermove', onPointerMove, { signal: events.signal });
    window.addEventListener('pointerup', onPointerUp, { signal: events.signal });
    window.addEventListener('pointercancel', onPointerCancel, { signal: events.signal });
    element.addEventListener('lostpointercapture', onPointerCancel, { signal: events.signal });
    element.addEventListener('keydown', onKeyDown, { signal: events.signal });
    document.addEventListener('visibilitychange', onVisibilityChange, { signal: events.signal });

    return () => {
      disposed = true;
      stopAuto();
      window.clearTimeout(scrollEndTimer);
      events.abort();
    };
  }, [carouselElement, ready, reducedMotion, setStep]);

  return {
    active,
    playing: ready && !reducedMotion && !manualActive,
    reducedMotion,
    interactionRef,
    setCarouselElement,
  };
}

export function useHomeLabel(active: RouteType, reducedMotion: boolean, ready: boolean) {
  const labelRef = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState(active);

  useEffect(() => {
    const element = labelRef.current;

    if (!ready || !element) {
      return;
    }

    const exiting = active !== displayed;
    const style = window.getComputedStyle(element);
    const animation = element.animate(
      [
        { opacity: style.opacity, transform: style.transform },
        { opacity: exiting ? 0 : 1, transform: exiting ? 'scale(0.6)' : 'scale(1)' },
      ],
      {
        duration: reducedMotion
          ? 0
          : exiting
            ? HOME_SCENE_CONFIG.presentation.labelExitDuration
            : HOME_SCENE_CONFIG.presentation.labelEnterDuration,
        easing: exiting ? 'cubic-bezier(0.4, 0, 1, 1)' : 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards',
      },
    );
    let cancelled = false;

    void animation.finished.then(
      () => {
        if (!cancelled && exiting) {
          setDisplayed(active);
        }
      },
      () => undefined,
    );

    return () => {
      cancelled = true;
      const current = window.getComputedStyle(element);

      element.style.opacity = current.opacity;
      element.style.transform = current.transform;
      animation.cancel();
    };
  }, [active, displayed, reducedMotion, ready]);

  return { labelRef, displayed };
}

export function useHomeCanvas(
  step: number,
  reducedMotion: boolean,
  setReady: Dispatch<SetStateAction<boolean>>,
  interactionRef: RefObject<HomeInteraction>,
) {
  const [backgroundCanvas, setBackgroundCanvas] = useState<HTMLCanvasElement | null>(null);
  const [horizonCanvas, setHorizonCanvas] = useState<HTMLCanvasElement | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const reducedMotionRef = useRef(reducedMotion);
  const redrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
    redrawRef.current?.();
  }, [step, reducedMotion]);

  useEffect(() => {
    if (!backgroundCanvas || !horizonCanvas) {
      return;
    }

    const controller = new AbortController();
    const renderers: {
      canvas: HTMLCanvasElement;
      renderer: NonNullable<ReturnType<typeof createSpaceRenderer>>;
      rotation: number;
      maxSize: number;
    }[] = [];
    let initRevision = 0;
    let frame = 0;
    let lastFrame: number | undefined;
    let seconds: number = HOME_SCENE_CONFIG.animation.time;
    let automaticAngle = 0;
    let gestureAngle = interactionAngle();

    function interactionAngle() {
      const { turns } = interactionRef.current;

      return (turns * HOME_SCENE_CONFIG.presentation.cardAngle * Math.PI) / 180;
    }

    function draw() {
      const environmentAngle = (automaticAngle + gestureAngle) % (2 * Math.PI);

      renderers.forEach(({ renderer }) => renderer.draw(seconds, environmentAngle, anchorRef.current));
    }

    function tick(now: number) {
      const elapsed = now - (lastFrame ?? now - 1000 / 30);

      if (elapsed >= 1000 / 30 - 1) {
        const delta = Math.min(elapsed, 70) / 1000;

        seconds += delta;

        automaticAngle =
          (automaticAngle + ((HOME_SCENE_CONFIG.presentation.starfieldSpeed * Math.PI) / 180) * delta) % (2 * Math.PI);

        gestureAngle += (interactionAngle() - gestureAngle) * (1 - Math.exp(-elapsed / 150));
        draw();
        lastFrame = now;
      }

      frame = requestAnimationFrame(tick);
    }

    function syncPlayback() {
      cancelAnimationFrame(frame);
      lastFrame = undefined;

      if (reducedMotionRef.current) {
        gestureAngle = interactionAngle();
      }

      draw();

      if (renderers.length === 2 && !reducedMotionRef.current && !document.hidden) {
        frame = requestAnimationFrame(tick);
      }
    }

    function resize() {
      renderers.forEach(({ canvas, renderer, rotation, maxSize }) => {
        const { clientWidth, clientHeight } = canvas;
        const radians = (rotation * Math.PI) / 180;
        const extent = Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians));
        const displayScale = canvas.getBoundingClientRect().width / (extent * Math.max(1, clientWidth));
        const scale = Math.min(
          Math.min(window.devicePixelRatio, HOME_SCENE_CONFIG.rendering.pixelRatio) * displayScale,
          maxSize / Math.max(1, clientWidth, clientHeight),
        );

        canvas.width = Math.max(1, Math.round(clientWidth * scale));
        canvas.height = Math.max(1, Math.round(clientHeight * scale));
        renderer.resize();
      });
      draw();
    }

    function disposeRenderers() {
      cancelAnimationFrame(frame);
      renderers.splice(0).forEach(({ canvas, renderer }) => {
        canvas.removeAttribute('data-ready');
        renderer.dispose();
      });
    }

    async function init() {
      const revision = ++initRevision;

      disposeRenderers();
      setReady(false);

      try {
        const { backgroundShader, horizonShader, blackbodyData } = await loadHomeResources(controller.signal);

        if (controller.signal.aborted || revision !== initRevision) {
          return;
        }

        const layers = [
          { canvas: backgroundCanvas, shader: backgroundShader, rotation: 0, maxSize: 2880 },
          {
            canvas: horizonCanvas,
            shader: horizonShader,
            rotation: HOME_SCENE_CONFIG.presentation.rotation,
            maxSize: 2048,
          },
        ];

        for (const { canvas, shader, rotation, maxSize } of layers) {
          if (!canvas) {
            return;
          }

          const renderer = createSpaceRenderer(canvas, shader, blackbodyData);

          if (!renderer) {
            disposeRenderers();

            return;
          }

          renderers.push({ canvas, renderer, rotation, maxSize });
        }

        resize();
        renderers.forEach(({ canvas }) => {
          canvas.dataset.ready = 'true';
        });
        setReady(true);
        syncPlayback();
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Unable to load home scene', error);
          disposeRenderers();
        }
      }
    }

    function handleContextLoss(event: Event) {
      event.preventDefault();
      setReady(false);
      cancelAnimationFrame(frame);
      renderers.forEach(({ canvas }) => canvas.removeAttribute('data-ready'));
    }

    function handleContextRestored() {
      if (![backgroundCanvas, horizonCanvas].some((canvas) => canvas?.getContext('webgl2')?.isContextLost())) {
        void init();
      }
    }

    redrawRef.current = syncPlayback;
    const observer = new ResizeObserver(resize);

    for (const canvas of [backgroundCanvas, horizonCanvas]) {
      observer.observe(canvas);
      canvas.addEventListener('webglcontextlost', handleContextLoss);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);
    }

    document.addEventListener('visibilitychange', syncPlayback);
    void init();

    return () => {
      controller.abort();
      redrawRef.current = null;
      observer.disconnect();
      disposeRenderers();
      document.removeEventListener('visibilitychange', syncPlayback);

      for (const canvas of [backgroundCanvas, horizonCanvas]) {
        canvas.removeEventListener('webglcontextlost', handleContextLoss);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      }
    };
  }, [backgroundCanvas, horizonCanvas, setReady, interactionRef]);

  return { anchorRef, setBackgroundCanvas, setHorizonCanvas };
}
