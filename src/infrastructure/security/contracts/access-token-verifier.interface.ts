import type { AccessPayload } from '../types';

export interface AccessTokenVerifier {
  verify(token: string): Promise<AccessPayload>;
}
