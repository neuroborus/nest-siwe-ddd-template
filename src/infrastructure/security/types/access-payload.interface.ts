import type { Address } from '@/shared/domain/types';

export interface AccessPayload {
  readonly sub: string;
  readonly ethAddress: Address;
  readonly sessionId: string;
}
