import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionRepository } from '../infrastructure/persistence';

@Injectable()
export class SessionCleanupCron {
  private readonly logger = new Logger(SessionCleanupCron.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  @Cron(CronExpression.EVERY_HOUR)
  async clearExpired(): Promise<void> {
    const deleted = await this.sessionRepository.deleteExpired(new Date());
    this.logger.debug({ deleted }, 'Expired sessions cleared');
  }
}
