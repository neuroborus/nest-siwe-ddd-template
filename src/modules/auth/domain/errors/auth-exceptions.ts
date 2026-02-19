import { HttpException, HttpStatus } from '@nestjs/common';
import { createHttpException } from '@/shared/errors';
import { AuthErrorCode } from './auth-error-code.enum';

export function invalidSiweFormatException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.InvalidSiweFormat,
    message: 'Invalid SIWE message format',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function invalidSiweVersionException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.InvalidSiweVersion,
    message: 'Invalid SIWE version',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function siweDomainMismatchException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.SiweDomainMismatch,
    message: 'SIWE domain mismatch',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function siweUriMismatchException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.SiweUriMismatch,
    message: 'SIWE uri mismatch',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function siweChainIdNotAllowedException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.SiweChainIdNotAllowed,
    message: 'SIWE chainId is not allowed',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function siweIssuedAtRequiredException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.SiweIssuedAtRequired,
    message: 'SIWE issuedAt is required',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function siweIssuedAtInvalidException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.SiweIssuedAtInvalid,
    message: 'SIWE issuedAt is invalid',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function siweIssuedAtTooOldException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.SiweIssuedAtTooOld,
    message: 'SIWE issuedAt is too old',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function siweIssuedAtFutureException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.SiweIssuedAtFuture,
    message: 'SIWE issuedAt is in the future',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function invalidOrExpiredNonceException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.InvalidOrExpiredNonce,
    message: 'Invalid or expired nonce',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function wrongSignatureException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.WrongSignature,
    message: 'Wrong signature',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function nonceAlreadyUsedException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.NonceAlreadyUsed,
    message: 'Nonce already used or expired',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function wrongTokenException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.WrongToken,
    message: 'Wrong token',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function noRefreshTokenException(): HttpException {
  return createHttpException({
    code: AuthErrorCode.NoRefreshToken,
    message: 'No refresh token',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}
