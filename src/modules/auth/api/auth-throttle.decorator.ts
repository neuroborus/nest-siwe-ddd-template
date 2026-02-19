import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

const DEFAULT_LIMIT = 5;
const DEFAULT_TTL_MS = 60_000;

/**
 * Per-module throttle for auth endpoints.
 * Overrides global ThrottlerGuard defaults with auth-specific limits.
 */
export function AuthThrottle(limit = DEFAULT_LIMIT, ttl = DEFAULT_TTL_MS) {
  return applyDecorators(Throttle({ default: { limit, ttl } }));
}
