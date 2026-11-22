import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { createAuthMiddleware } from 'better-auth/api';
import { betterAuth } from 'better-auth/minimal';
import { username } from 'better-auth/plugins';
import { db } from '@/lib/db';
import authService from '@/lib/services/auth';

export const auth = betterAuth({
  telemetry: {
    enabled: false,
  },
  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 3,
    maxPasswordLength: 24,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === '/sign-up/email') {
        authService.assertRegistrationAllowed();
      }
    }),
  },
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
    },
  },
  plugins: [username()],
});
