import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Structured error response body returned by GlobalExceptionFilter.
 */
export class ErrorResponseDto {
  @ApiProperty({ description: 'Application error code (e.g. 10130, 10200)', example: 10130 })
  code!: number;

  @ApiProperty({ description: 'HTTP status code', example: 401 })
  statusCode!: number;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Authorization header must be Bearer <token>',
  })
  message!: string;

  @ApiProperty({ description: 'Error category', example: 'Unauthorized' })
  error!: string;

  @ApiPropertyOptional({
    description: 'Additional details (e.g. validation field errors or entity id)',
  })
  details?: Record<string, unknown>;

  @ApiProperty({ description: 'ISO 8601 timestamp' })
  timestamp!: string;

  @ApiPropertyOptional({ description: 'Request path (injected by exception filter)' })
  path?: string;
}
