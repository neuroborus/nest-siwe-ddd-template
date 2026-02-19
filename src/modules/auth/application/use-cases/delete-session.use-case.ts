import { Injectable, Logger } from '@nestjs/common';
import { SessionRepository } from '../../infrastructure/persistence';

@Injectable()
export class DeleteSessionUseCase {
  private readonly logger = new Logger(DeleteSessionUseCase.name);

  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(sessionId: string): Promise<void> {
    await this.sessionRepository.deleteById(sessionId);
    this.logger.debug(`Session deleted: ${sessionId}`);
  }
}
