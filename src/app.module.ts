import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@/config';
import { DatabaseModule } from '@/database/database.module';
import { RequestModule, RequestInterceptor, GlobalExceptionFilter } from '@/infrastructure/request';
import { SecurityModule, JwtAuthGuard } from '@/infrastructure/security';
import { AuthModule } from '@/modules/auth/auth.module';
import { OpsModule } from '@/modules/ops/ops.module';
import { pinoHttp } from '@/pino';

@Module({
  imports: [
    LoggerModule.forRoot({ pinoHttp }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({ throttlers: [{ limit: 60, ttl: 60_000 }] }),
    ConfigModule,
    DatabaseModule,
    RequestModule,
    SecurityModule,
    AuthModule,
    OpsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
