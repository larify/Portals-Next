'use client';

import { useTranslations } from 'next-intl';
import { useHomeScene } from '@/hooks/use-home';
import styles from '@/styles/home/scene.module.css';

export function HomeModeLabel() {
  const t = useTranslations('home');
  const scene = useHomeScene();

  const { labelRef, displayed, playing } = scene;

  return (
    <div
      aria-atomic="true"
      aria-live={playing ? 'off' : 'polite'}
      className={`${styles.modeLabel} absolute top-full left-1/2 z-20 w-[min(90svw,calc(var(--scene-unit)*0.8))] -translate-x-1/2 text-center`}
    >
      <div ref={labelRef} className="flex flex-col items-center gap-3" style={{ opacity: 0, transform: 'scale(0.6)' }}>
        <h1
          id="home-title"
          className="font-serif text-[clamp(1.25rem,calc(var(--scene-unit)*0.038),3.5rem)] leading-[1.1] font-semibold tracking-[-0.035em] text-balance uppercase"
        >
          {t(`modes.${displayed}.title`)}
        </h1>
        <p className="text-[clamp(0.75rem,calc(var(--scene-unit)*0.012),1.125rem)] leading-tight text-current/50">
          {t(`modes.${displayed}.description`)}
        </p>
      </div>
    </div>
  );
}
