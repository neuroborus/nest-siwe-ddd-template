import type { Address } from '@/shared/domain/types';
import type { Chain } from '@/shared/domain/types';

export interface ValidatedSiweData {
  readonly address: Address;
  readonly nonce: string;
  readonly chain: Chain;
}
