import { Request } from 'express';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { ClientData } from './client-data.interface';
import { RequestContext, Accessor } from './request.context';

@Injectable()
export class RequestInterceptor implements NestInterceptor {
  private readonly accessor = Accessor.RequestInterceptor;

  constructor(private readonly reqCtx: RequestContext) {
    if (this.accessor !== RequestInterceptor.name) {
      throw new Error(
        `Accessor mismatch: enum "${this.accessor}" !== class "${RequestInterceptor.name}"`,
      );
    }
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest<Request>();
    const clientData: ClientData = {
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.get('user-agent') ?? 'unknown',
    };

    this.reqCtx.setRequestId(req.id as string, this.accessor);
    this.reqCtx.setClientData(clientData, this.accessor);

    return next.handle();
  }
}
