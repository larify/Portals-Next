import { LayoutDashboard, LogIn } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { LanguageControl, ThemeControl } from '@/components/app/settings/system/preferences-controls';
import { UserMenu } from '@/components/app/shell/user-menu';
import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants/app';

type HomeHeaderProps = {
  user?: { image?: string | null };
};

export async function HomeHeader({ user }: HomeHeaderProps) {
  const t = await getTranslations();

  return (
    <header className="absolute inset-x-0 top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-[clamp(1rem,4vw,4rem)] pt-[clamp(1rem,4svh,2.75rem)]">
      <Link
        href="/"
        title={APP_NAME}
        className="max-w-full min-w-0 justify-self-start truncate rounded-sm font-serif text-sm font-semibold tracking-tight uppercase outline-none focus-visible:ring-2 focus-visible:ring-current sm:text-xl"
      >
        {APP_NAME}
      </Link>

      <nav aria-label={t('home.navigation')} className="flex items-center gap-0.5 justify-self-end p-1 max-sm:gap-0">
        <LanguageControl compact />
        <ThemeControl compact />
        {user ? (
          <>
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
              aria-label={t('admin.sidebar.dashboard')}
              title={t('admin.sidebar.dashboard')}
            >
              <LayoutDashboard aria-hidden="true" />
            </Link>
            <UserMenu compact initialImage={user.image} />
          </>
        ) : (
          <Link href="/sign-in" className={buttonVariants({ size: 'icon-sm' })} aria-label={t('auth.signIn.submit')}>
            <LogIn aria-hidden="true" />
          </Link>
        )}
      </nav>
    </header>
  );
}
