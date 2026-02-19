import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { setupSwagger } from '@/swagger';
import { staticConfig, NodeEnv } from '@/config';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: staticConfig.nodeEnv === NodeEnv.Prod ? staticConfig.auth.appOrigin : true,
      credentials: true,
    },
    bodyParser: true,
    rawBody: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(cookieParser());
  app.useLogger(app.get(Logger));
  await setupSwagger(app);
  await app.listen(staticConfig.port);
}
bootstrap();
