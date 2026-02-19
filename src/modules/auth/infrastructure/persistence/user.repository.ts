import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Address } from '@/shared/domain/types';
import { UserEntity } from '../../domain/entities';
import { randomId } from '@/shared/utils/random';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async findByEthAddress(ethAddress: Address): Promise<UserEntity | null> {
    return this.repository.findOne({
      where: { ethAddress: ethAddress.toLowerCase() as Address },
    });
  }

  async create(ethAddress: Address): Promise<UserEntity> {
    const entity = this.repository.create({
      id: randomId(),
      ethAddress: ethAddress.toLowerCase() as Address,
    });
    return this.repository.save(entity);
  }
}
