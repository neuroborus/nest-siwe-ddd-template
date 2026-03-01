import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/infrastructure/swagger';

export const SWAGGER_URL = '/swagger';

export async function setupSwagger(app: INestApplication): Promise<void> {
  const config = new DocumentBuilder()
    .setTitle('SIWE Auth API')
    .setDescription('EIP-4361 Sign-In with Ethereum authentication API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponseDto],
  });
  SwaggerModule.setup(SWAGGER_URL, app, document);
}
