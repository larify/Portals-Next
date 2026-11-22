'use client';

import type { ReactNode } from 'react';
import { useHome } from '@/hooks/use-home';
import { HomeContext } from '@/lib/client/home/context';

export function HomeSceneProvider({ children }: { children: ReactNode }) {
  const scene = useHome();

  return <HomeContext value={scene}>{children}</HomeContext>;
}
