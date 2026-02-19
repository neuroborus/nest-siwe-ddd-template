import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import type { Address } from '@/shared/domain/types';

@Entity('auth_nonces')
export class AuthNonceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  @Index()
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt!: Date | null;

  @Column({
    name: 'used_by_address',
    type: 'varchar',
    length: 42,
    nullable: true,
  })
  usedByAddress!: Address | null;

  @Column({ type: 'varchar', length: 40, unique: true })
  nonce!: string;
}
