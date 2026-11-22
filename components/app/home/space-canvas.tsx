'use client';

import { useHomeScene } from '@/hooks/use-home';

export function SpaceCanvas({ layer }: { layer: 'background' | 'horizon' }) {
  const scene = useHomeScene();

  return (
    <canvas
      ref={layer === 'background' ? scene.setBackgroundCanvas : scene.setHorizonCanvas}
      className="absolute inset-0 size-full opacity-0 data-[ready=true]:opacity-100"
    />
  );
}
