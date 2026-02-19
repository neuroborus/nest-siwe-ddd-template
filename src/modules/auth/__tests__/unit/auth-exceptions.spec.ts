import { HttpException } from '@nestjs/common';
import { AuthErrorCode } from '../../domain/errors/auth-error-code.enum';
import {
  invalidSiweFormatException,
  wrongTokenException,
  noRefreshTokenException,
  wrongSignatureException,
  invalidOrExpiredNonceException,
  nonceAlreadyUsedException,
} from '../../domain/errors/auth-exceptions';
import { missingBearerTokenException, SecurityErrorCode } from '@/infrastructure/security';

describe('Auth exception factories', () => {
  it('invalidSiweFormatException returns structured HttpException', () => {
    const err = invalidSiweFormatException();
    expect(err).toBeInstanceOf(HttpException);
    expect(err.getStatus()).toBe(401);

    const body = err.getResponse() as Record<string, unknown>;
    expect(body.code).toBe(AuthErrorCode.InvalidSiweFormat);
    expect(body.statusCode).toBe(401);
    expect(body.message).toBe('Invalid SIWE message format');
    expect(body.error).toBe('Unauthorized');
    expect(body.details).toEqual({});
    expect(body.timestamp).toBeDefined();
  });

  it('wrongTokenException returns 401 with WrongToken code', () => {
    const err = wrongTokenException();
    expect(err.getStatus()).toBe(401);

    const body = err.getResponse() as Record<string, unknown>;
    expect(body.code).toBe(AuthErrorCode.WrongToken);
    expect(body.message).toBe('Wrong token');
  });

  it('noRefreshTokenException returns 401 with NoRefreshToken code', () => {
    const err = noRefreshTokenException();
    expect(err.getStatus()).toBe(401);

    const body = err.getResponse() as Record<string, unknown>;
    expect(body.code).toBe(AuthErrorCode.NoRefreshToken);
  });

  it('wrongSignatureException returns 401 with WrongSignature code', () => {
    const err = wrongSignatureException();
    const body = err.getResponse() as Record<string, unknown>;
    expect(body.code).toBe(AuthErrorCode.WrongSignature);
  });

  it('invalidOrExpiredNonceException returns correct code', () => {
    const err = invalidOrExpiredNonceException();
    const body = err.getResponse() as Record<string, unknown>;
    expect(body.code).toBe(AuthErrorCode.InvalidOrExpiredNonce);
  });

  it('nonceAlreadyUsedException returns correct code', () => {
    const err = nonceAlreadyUsedException();
    const body = err.getResponse() as Record<string, unknown>;
    expect(body.code).toBe(AuthErrorCode.NonceAlreadyUsed);
  });

  it('missingBearerTokenException returns 401 with MissingBearerToken code', () => {
    const err = missingBearerTokenException();
    expect(err.getStatus()).toBe(401);

    const body = err.getResponse() as Record<string, unknown>;
    expect(body.code).toBe(SecurityErrorCode.MissingBearerToken);
    expect(body.message).toBe('Authorization header must be Bearer <token>');
    expect(body.error).toBe('Unauthorized');
    expect(body.details).toEqual({});
    expect(body.timestamp).toBeDefined();
  });

  it('all auth error codes are in the 10100-10199 range', () => {
    const codes = [
      AuthErrorCode.InvalidSiweFormat,
      AuthErrorCode.InvalidSiweVersion,
      AuthErrorCode.SiweDomainMismatch,
      AuthErrorCode.SiweUriMismatch,
      AuthErrorCode.SiweChainIdNotAllowed,
      AuthErrorCode.SiweIssuedAtRequired,
      AuthErrorCode.SiweIssuedAtInvalid,
      AuthErrorCode.SiweIssuedAtTooOld,
      AuthErrorCode.SiweIssuedAtFuture,
      AuthErrorCode.InvalidOrExpiredNonce,
      AuthErrorCode.WrongSignature,
      AuthErrorCode.NonceAlreadyUsed,
      AuthErrorCode.WrongToken,
      AuthErrorCode.NoRefreshToken,
    ];

    for (const code of codes) {
      expect(code).toBeGreaterThanOrEqual(10100);
      expect(code).toBeLessThan(10200);
    }
  });
});
