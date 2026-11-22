import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Suspense } from 'react';
import { HomeCarousel } from '@/components/app/home/carousel';
import { HomeHeader } from '@/components/app/home/header';
import { HomeSceneProvider } from '@/components/app/home/scene-provider';
import { HomeStarfield } from '@/components/app/home/starfield';
import { PreferencesProvider } from '@/components/app/settings/system/preferences-provider';
import { getRequestSession } from '@/lib/auth/session';
import { APP_NAME } from '@/lib/constants/app';
import { getRequestPreferences } from '@/lib/services/preferences/server';
import styles from '@/styles/home/scene.module.css';

export const metadata: Metadata = { title: APP_NAME };

async function HomePage() {
  const [preferences, session, messages] = await Promise.all([
    getRequestPreferences(),
    getRequestSession(),
    getMessages(),
  ]);

  return (
    <NextIntlClientProvider
      locale={preferences.language}
      messages={{
        home: messages.home,
        admin: {
          sidebar: { account: messages.admin.sidebar.account },
          userMenu: messages.admin.userMenu,
          settings: { system: { preferences: messages.admin.settings.system.preferences } },
        },
      }}
    >
      <PreferencesProvider initialPreferences={preferences}>
        <div
          className={`${styles.scene} relative isolate mx-auto flex min-h-[max(24rem,100svh)] w-full max-w-(--scene-max-width) flex-1 flex-col text-[#f3f0df]`}
        >
          <HomeHeader user={session?.user} />
          <HomeCarousel />
        </div>
      </PreferencesProvider>
    </NextIntlClientProvider>
  );
}

export default function Page() {
  return (
    <HomeSceneProvider>
      <div className={`${styles.viewport} relative isolate flex min-h-svh flex-1 flex-col`}>
        <HomeStarfield />
        <Suspense fallback={null}>
          <HomePage />
        </Suspense>
      </div>
    </HomeSceneProvider>
  );
}
