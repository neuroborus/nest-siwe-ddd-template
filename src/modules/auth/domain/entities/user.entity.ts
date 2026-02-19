import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import type { Address } from '@/shared/domain/types';
import { SessionEntity } from './session.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'eth_address', type: 'varchar', length: 42, unique: true })
  @Index()
  ethAddress!: Address;

  @OneToMany(() => SessionEntity, (session) => session.user)
  sessions!: SessionEntity[];
}
