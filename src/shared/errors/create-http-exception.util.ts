import { HttpException } from '@nestjs/common';
import type { ErrorPayload } from './error-payload.type';

export function createHttpException(payload: ErrorPayload): HttpException {
  return new HttpException(
    {
      code: payload.code,
      statusCode: payload.status,
      message: payload.message,
      error: payload.error,
      details: payload.details ?? {},
      timestamp: new Date().toISOString(),
    },
    payload.status,
  );
}
