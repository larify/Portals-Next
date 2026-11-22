import { APIError } from 'better-auth/api';
import 'server-only';

export function assertRegistrationAllowed(): void {
  const allowSignUp = process.env.PORTALS_ALLOW_SIGN_UP;

  if (allowSignUp !== 'true' && allowSignUp !== '1') {
    throw new APIError('INTERNAL_SERVER_ERROR');
  }
}

const service = { assertRegistrationAllowed };

export default service;
