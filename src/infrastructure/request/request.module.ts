import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestContext } from './request.context';
import { RequestContextMiddleware } from './request-context.middleware';

@Module({
  providers: [RequestContext],
  exports: [RequestContext],
})
export class RequestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
