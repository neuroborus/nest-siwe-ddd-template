import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccessTokenVerifier, AccessPayload } from '@/infrastructure/security';

@Injectable()
export class JwtAccessTokenVerifier implements AccessTokenVerifier {
  constructor(private readonly jwt: JwtService) {}

  async verify(token: string): Promise<AccessPayload> {
    return this.jwt.verifyAsync(token);
  }
}
