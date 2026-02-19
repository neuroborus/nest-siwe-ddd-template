import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NonceData } from '../../domain/types';
import { AuthNonceRepository } from '../../infrastructure/persistence';

@Injectable()
export class CreateNonceUseCase {
  private readonly logger = new Logger(CreateNonceUseCase.name);

  constructor(
    private readonly nonceRepository: AuthNonceRepository,
    private readonly config: ConfigService,
  ) {}

  async execute(): Promise<NonceData> {
    const ttlMs = this.config.getOrThrow<number>('auth.authNonceTtlMs');
    const expiresAt = new Date(Date.now() + ttlMs);
    const entity = await this.nonceRepository.create(expiresAt);

    this.logger.debug(`Nonce created: ${entity.nonce}`);

    return {
      nonce: entity.nonce,
      expiresAt: entity.expiresAt,
    };
  }
}
