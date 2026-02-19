import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import type { Address } from '@/shared/domain/types';
import { AuthNonceEntity } from '../../domain/entities';
import { randomId, randomAuthNonce } from '@/shared/utils/random';

@Injectable()
export class AuthNonceRepository {
  constructor(
    @InjectRepository(AuthNonceEntity)
    private readonly repository: Repository<AuthNonceEntity>,
  ) {}

  async create(expiresAt: Date): Promise<AuthNonceEntity> {
    const entity = this.repository.create({
      id: randomId(),
      expiresAt,
      nonce: randomAuthNonce(),
    });
    return this.repository.save(entity);
  }

  async findByNonce(nonceValue: string): Promise<AuthNonceEntity | null> {
    return this.repository.findOne({ where: { nonce: nonceValue } });
  }

  /**
   * Atomically marks a nonce as used. Returns true if exactly one row was updated
   * (i.e. the nonce was valid, unexpired, and unused). Uses `usedAt IS NULL`
   * and `expiresAt > now` to guarantee one-time use.
   */
  async consume(nonce: string, usedByAddress: Address): Promise<boolean> {
    const result = await this.repository.update(
      {
        nonce,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      {
        usedAt: new Date(),
        usedByAddress: usedByAddress.toLowerCase() as Address,
      },
    );
    return result.affected === 1;
  }

  async deleteExpired(before: Date): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(before),
    });
    return result.affected ?? 0;
  }
}
