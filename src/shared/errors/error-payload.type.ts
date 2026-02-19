import { HttpStatus } from '@nestjs/common';

export type ErrorPayload = {
  code: number;
  message: string;
  error: string;
  status: HttpStatus;
  details?: Record<string, unknown>;
};
