'use client';

import { createContext } from 'react';
import type { useHome } from '@/hooks/use-home';

export const HomeContext = createContext<ReturnType<typeof useHome> | null>(null);
