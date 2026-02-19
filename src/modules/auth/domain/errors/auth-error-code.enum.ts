/**
 * Auth domain error codes.
 * Block: 10100..10199 (base 10000 + offset 100).
 */
export const enum AuthErrorCode {
  InvalidSiweFormat = 10100,
  InvalidSiweVersion = 10101,
  SiweDomainMismatch = 10102,
  SiweUriMismatch = 10103,
  SiweChainIdNotAllowed = 10104,
  SiweIssuedAtRequired = 10105,
  SiweIssuedAtInvalid = 10106,
  SiweIssuedAtTooOld = 10107,
  SiweIssuedAtFuture = 10108,
  InvalidOrExpiredNonce = 10109,
  WrongSignature = 10110,
  NonceAlreadyUsed = 10111,
  WrongToken = 10120,
  NoRefreshToken = 10121,
}
