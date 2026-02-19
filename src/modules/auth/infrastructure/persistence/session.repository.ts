import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { SessionEntity } from '../../domain/entities';

interface SessionTarget {
  readonly userId: string;
  readonly ipAddress: string;
  readonly userAgent: string;
}

@Injectable()
export class SessionRepository {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly repository: Repository<SessionEntity>,
  ) {}

  /**
   * Replace-or-create a session for the given (userId, ipAddress, userAgent).
   * Uses a transaction with delete+insert to avoid mutating the primary key
   * of an existing row.
   */
  async upsert(
    id: string,
    target: SessionTarget,
    refreshTokenHash: string,
    expired: Date,
  ): Promise<void> {
    await this.repository.manager.transaction(async (em) => {
      await em.delete(SessionEntity, {
        userId: target.userId,
        ipAddress: target.ipAddress,
        userAgent: target.userAgent,
      });
      await em.insert(SessionEntity, {
        id,
        userId: target.userId,
        ipAddress: target.ipAddress,
        userAgent: target.userAgent,
        refreshTokenHash,
        expired,
      });
    });
  }

  async findById(id: string): Promise<SessionEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  async deleteExpired(before: Date): Promise<number> {
    const result = await this.repository.delete({
      expired: LessThan(before),
    });
    return result.affected ?? 0;
  }
}
