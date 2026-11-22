'use client';

import { useHomeScene } from '@/hooks/use-home';
import { SpaceCanvas } from './space-canvas';

export function EventHorizon({ rotation }: { rotation: number }) {
  const scene = useHomeScene();

  const { anchorRef } = scene;

  return (
    <div
      ref={anchorRef}
      aria-hidden="true"
      className="relative aspect-square w-full scale-[1.8]"
      style={{ rotate: `${rotation}deg` }}
    >
      <SpaceCanvas layer="horizon" />
    </div>
  );
}
