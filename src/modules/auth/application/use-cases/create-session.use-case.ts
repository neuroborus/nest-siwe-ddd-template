import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Address } from '@/shared/domain/types';
import type { LoginData } from '../../domain/types';
import { UserRepository, SessionRepository } from '../../infrastructure/persistence';
import { TokenFactory } from '../../infrastructure/jwt';
import { hash } from '@/shared/utils/security';
import { randomId } from '@/shared/utils/random';

@Injectable()
export class CreateSessionUseCase {
  private readonly logger = new Logger(CreateSessionUseCase.name);

  constructor(
    private readonly config: ConfigService,
    private readonly tokenFactory: TokenFactory,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(ethAddress: Address, ipAddress: string, userAgent: string): Promise<LoginData> {
    let user = await this.userRepository.findByEthAddress(ethAddress);
    if (!user) user = await this.userRepository.create(ethAddress);

    const sessionId = randomId();
    const tokens = await this.tokenFactory.generate(user.id, ethAddress, sessionId);

    const refreshTokenHash = hash(tokens.refreshToken);
    const refreshExpireMs = this.config.getOrThrow<number>('auth.refreshTokenTtlMs');
    const expired = new Date(Date.now() + refreshExpireMs);

    await this.sessionRepository.upsert(
      sessionId,
      { userId: user.id, ipAddress, userAgent },
      refreshTokenHash,
      expired,
    );

    this.logger.debug(`Session created for ${ethAddress}`);

    return tokens;
  }
}
