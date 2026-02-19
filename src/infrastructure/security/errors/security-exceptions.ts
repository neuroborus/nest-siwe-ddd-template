import { HttpException, HttpStatus } from '@nestjs/common';
import { createHttpException } from '@/shared/errors';
import { SecurityErrorCode } from './security-error-code.enum';

export function missingBearerTokenException(): HttpException {
  return createHttpException({
    code: SecurityErrorCode.MissingBearerToken,
    message: 'Authorization header must be Bearer <token>',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}

export function invalidAccessTokenException(): HttpException {
  return createHttpException({
    code: SecurityErrorCode.InvalidAccessToken,
    message: 'Access token is invalid or expired',
    error: 'Unauthorized',
    status: HttpStatus.UNAUTHORIZED,
  });
}
