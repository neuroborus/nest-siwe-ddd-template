import { Chain } from '@/shared/domain/types';
import { envOrDefault, requireEnv } from './envs';

const DEFAULT_NONCE_TTL_MS = '300000'; // 5 minutes
const DEFAULT_ISSUED_AT_TTL_MS = '300000'; // 5 minutes
const DEFAULT_CLOCK_SKEW_MS = '30000'; // 30 seconds

const ACCESS_TOKEN_TTL_MS = '900000'; // 15 minutes
const REFRESH_TOKEN_TTL_MS = '259200000'; // 3 days

const CHAIN_VALUES = new Set<number>(
  Object.values(Chain).filter((v): v is number => typeof v === 'number'),
);

function parseChains(value: string): Chain[] {
  const ids = value
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isInteger(item) && item > 0);

  const unknowns = ids.filter((id) => !CHAIN_VALUES.has(id));
  if (unknowns.length > 0) {
    throw new Error(
      `ALLOWED_CHAIN_IDS contains unknown chain IDs: ${unknowns.join(', ')}. ` +
        `Supported: ${[...CHAIN_VALUES].join(', ')}`,
    );
  }

  const chains = [...new Set(ids)] as Chain[];
  if (chains.length === 0) {
    throw new Error('ALLOWED_CHAIN_IDS must contain at least one valid chain ID');
  }

  return chains;
}

const accessSecret = requireEnv('ACCESS_SECRET');
const refreshSecret = requireEnv('REFRESH_SECRET');
const appDomain = requireEnv('APP_DOMAIN');
const appOrigin = requireEnv('APP_ORIGIN');

const authNonceTtlMs = envOrDefault('SIWE_NONCE_TTL_MS', DEFAULT_NONCE_TTL_MS, {
  warnOnDefault: true,
});
const siweIssuedAtTtlMs = envOrDefault('SIWE_ISSUED_AT_TTL_MS', DEFAULT_ISSUED_AT_TTL_MS, {
  warnOnDefault: true,
});
const siweClockSkewMs = envOrDefault('SIWE_CLOCK_SKEW_MS', DEFAULT_CLOCK_SKEW_MS, {
  warnOnDefault: true,
});

const allowedChains = requireEnv('ALLOWED_CHAIN_IDS');

export const authConfig = {
  authNonceTtlMs: parseInt(authNonceTtlMs, 10),
  appDomain,
  appOrigin,
  allowedChains: parseChains(allowedChains),
  siweIssuedAtTtlMs: parseInt(siweIssuedAtTtlMs, 10),
  siweClockSkewMs: parseInt(siweClockSkewMs, 10),
  accessSecret,
  accessTokenTtlMs: parseInt(ACCESS_TOKEN_TTL_MS, 10),
  refreshSecret,
  refreshTokenTtlMs: parseInt(REFRESH_TOKEN_TTL_MS, 10),
} as const;
