import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export function AuthEndpoint(): MethodDecorator & ClassDecorator {
  return applyDecorators(ApiBearerAuth());
}
