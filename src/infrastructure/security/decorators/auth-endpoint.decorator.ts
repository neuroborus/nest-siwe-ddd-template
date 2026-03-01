import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/infrastructure/swagger';

export function AuthEndpoint(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiBearerAuth(),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Missing or invalid Bearer token',
      type: ErrorResponseDto,
      headers: {
        'X-Error-Code': {
          description: 'Application error code that matches the `code` value in the response body.',
          schema: { type: 'integer', example: 10130 },
        },
      },
    }),
  );
}
