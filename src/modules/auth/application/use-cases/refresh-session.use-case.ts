import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Address } from '@/shared/domain/types';
import type { RefreshSessionData } from '../../domain/types';
import { wrongTokenException } from '../../domain/errors';
import { SessionRepository } from '../../infrastructure/persistence';
import { TokenFactory } from '../../infrastructure/jwt';
import { hash } from '@/shared/utils/security';

interface RefreshPayload {
  sub: string;
  ethAddress: Address;
  sessionId: string;
}

@Injectable()
export class RefreshSessionUseCase {
  private readonly logger = new Logger(RefreshSessionUseCase.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly tokenFactory: TokenFactory,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(
    ipAddress: string,
    userAgent: string,
    refreshToken: string,
  ): Promise<RefreshSessionData> {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow('auth.refreshSecret'),
      });
    } catch {
      throw wrongTokenException();
    }

    const session = await this.sessionRepository.findById(payload.sessionId);
    if (!session) throw wrongTokenException();

    if (session.expired < new Date()) {
      await this.sessionRepository.deleteById(payload.sessionId);
      throw wrongTokenException();
    }

    if (session.refreshTokenHash !== hash(refreshToken)) {
      await this.sessionRepository.deleteById(payload.sessionId);
      throw wrongTokenException();
    }

    const loginData = await this.tokenFactory.generate(
      payload.sub,
      payload.ethAddress,
      payload.sessionId,
    );

    const refreshExpireMs = this.config.getOrThrow<number>('auth.refreshTokenTtlMs');
    const expired = new Date(Date.now() + refreshExpireMs);

    await this.sessionRepository.upsert(
      payload.sessionId,
      { userId: payload.sub, ipAddress, userAgent },
      hash(loginData.refreshToken),
      expired,
    );

    this.logger.debug(`Session refreshed for ${payload.ethAddress}`);

    return {
      ethAddress: payload.ethAddress,
      loginData,
    };
  }
}
