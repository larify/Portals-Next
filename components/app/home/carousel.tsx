'use client';

import { useTranslations } from 'next-intl';
import { useHomeScene } from '@/hooks/use-home';
import { HOME_SCENE_CONFIG } from '@/lib/constants/home';
import { EventHorizon } from './event-horizon';
import { HomeModeLabel } from './mode-label';

export function HomeCarousel() {
  const t = useTranslations('home');
  const scene = useHomeScene();

  const { ready, setCarouselElement } = scene;

  return (
    <main
      ref={setCarouselElement}
      aria-label={ready ? undefined : t('title')}
      aria-labelledby={ready ? 'home-title' : undefined}
      className="relative isolate flex flex-1 touch-none flex-col overflow-hidden select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current"
      tabIndex={0}
    >
      <div className="pointer-events-none absolute top-[46%] left-1/2 z-10 w-[clamp(12rem,calc(var(--scene-unit)*0.4),40rem)] -translate-1/2 max-sm:w-[clamp(12rem,65svw,21rem)]">
        <EventHorizon rotation={HOME_SCENE_CONFIG.presentation.rotation} />
        {ready && <HomeModeLabel />}
      </div>
    </main>
  );
}
