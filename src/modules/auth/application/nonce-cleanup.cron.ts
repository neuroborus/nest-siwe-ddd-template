import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthNonceRepository } from '../infrastructure/persistence';

@Injectable()
export class NonceCleanupCron {
  private readonly logger = new Logger(NonceCleanupCron.name);

  constructor(private readonly nonceRepository: AuthNonceRepository) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async clearExpired(): Promise<void> {
    const deleted = await this.nonceRepository.deleteExpired(new Date());
    this.logger.debug({ deleted }, 'Expired auth-nonces cleared');
  }
}
