import { generateNonce } from 'siwe';

export function randomAuthNonce(): string {
  return generateNonce();
}
