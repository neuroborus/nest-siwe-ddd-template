import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import type { AccessTokenVerifier } from '../contracts';
import type { AccessPayload } from '../types';
import { ACCESS_TOKEN_VERIFIER } from '../tokens';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { missingBearerTokenException, invalidAccessTokenException } from '../errors';
import { RequestContext, Accessor } from '@/infrastructure/request';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly accessor = Accessor.JwtAuthGuard;

  constructor(
    @Inject(ACCESS_TOKEN_VERIFIER)
    private readonly tokenVerifier: AccessTokenVerifier,
    private readonly requestStorage: RequestContext,
    private readonly reflector: Reflector,
  ) {
    if (this.accessor !== JwtAuthGuard.name) {
      throw new Error(
        `Accessor mismatch: enum "${this.accessor}" !== class "${JwtAuthGuard.name}"`,
      );
    }
  }

  private saveRequestData(accessPayload: AccessPayload): void {
    this.requestStorage.setUserId(accessPayload.sub, this.accessor);
    this.requestStorage.setEthAddress(accessPayload.ethAddress, this.accessor);
    this.requestStorage.setSessionId(accessPayload.sessionId, this.accessor);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw missingBearerTokenException();
    }

    const token = authHeader.split(' ')[1];
    if (!token) throw missingBearerTokenException();

    try {
      const payload: AccessPayload = await this.tokenVerifier.verify(token);
      this.saveRequestData(payload);
      return true;
    } catch {
      throw invalidAccessTokenException();
    }
  }
}
