import { Request, Response } from 'express';
import { Catch, HttpException, HttpStatus, ExceptionFilter, ArgumentsHost } from '@nestjs/common';

/**
 * Catches every exception that propagates through the NestJS pipeline
 * (guards, pipes, interceptors, handlers) and normalises the response
 * into the structured payload required by CONVENTIONS:
 *
 *   { code, statusCode, message, error, details, timestamp, path }
 *
 * Structured exceptions created via `createHttpException` already carry
 * all fields except `path`; this filter injects it.
 * Unstructured NestJS-native exceptions (404, validation, etc.) and
 * unknown runtime errors are normalised into the same shape.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const path = request.url;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'object' && body !== null && 'code' in body) {
        response.status(status).json({ ...(body as object), path });
        return;
      }

      const raw = typeof body === 'string' ? { message: body } : (body as Record<string, unknown>);

      response.status(status).json({
        code: status,
        statusCode: status,
        message: raw.message ?? exception.message,
        error: raw.error ?? 'Error',
        details: {},
        timestamp: new Date().toISOString(),
        path,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
      error: 'Internal Server Error',
      details: {},
      timestamp: new Date().toISOString(),
      path,
    });
  }
}
