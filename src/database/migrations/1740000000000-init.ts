import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

export class Init1740000000000 implements MigrationInterface {
  name = 'Init1740000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'eth_address',
            type: 'varchar',
            length: '42',
            isUnique: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'IDX_users_eth_address',
        columnNames: ['eth_address'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'expired',
            type: 'timestamp',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
          },
          {
            name: 'user_agent',
            type: 'varchar',
            length: '512',
          },
          {
            name: 'refresh_token_hash',
            type: 'varchar',
            length: '64',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'sessions',
      new TableIndex({
        name: 'IDX_sessions_expired',
        columnNames: ['expired'],
      }),
    );

    await queryRunner.createUniqueConstraint(
      'sessions',
      new TableUnique({
        name: 'UQ_session_target',
        columnNames: ['user_id', 'ip_address', 'user_agent'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'auth_nonces',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'used_by_address',
            type: 'varchar',
            length: '42',
            isNullable: true,
          },
          {
            name: 'nonce',
            type: 'varchar',
            length: '40',
            isUnique: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'auth_nonces',
      new TableIndex({
        name: 'IDX_auth_nonces_expires_at',
        columnNames: ['expires_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('auth_nonces');
    await queryRunner.dropTable('sessions');
    await queryRunner.dropTable('users');
  }
}
