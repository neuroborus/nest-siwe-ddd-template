import type { Address } from '@/shared/domain/types';
import type { LoginData } from './login-data.interface';

export interface RefreshSessionData {
  readonly ethAddress: Address;
  readonly loginData: LoginData;
}
