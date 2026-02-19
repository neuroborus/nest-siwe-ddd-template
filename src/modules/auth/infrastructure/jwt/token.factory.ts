import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Address } from '@/shared/domain/types';
import type { AccessPayload } from '@/infrastructure/security';
import type { LoginData } from '../../domain/types';

@Injectable()
export class TokenFactory {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  async generate(userId: string, ethAddress: Address, sessionId: string): Promise<LoginData> {
    const refreshExpireMs = this.config.getOrThrow<number>('auth.refreshTokenTtlMs');

    const accessPayload: AccessPayload = { sub: userId, ethAddress, sessionId };
    const refreshPayload = { sub: userId, ethAddress, sessionId };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload),
      this.jwt.signAsync(refreshPayload, {
        expiresIn: Math.floor(refreshExpireMs / 1000),
        secret: this.config.getOrThrow('auth.refreshSecret'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      accessExpireMs: this.config.getOrThrow<number>('auth.accessTokenTtlMs'),
      refreshExpireMs,
    };
  }
}
