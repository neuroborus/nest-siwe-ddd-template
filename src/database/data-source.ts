/**
 * TypeORM CLI loads this file via ts-node with -d path. We use a relative
 * import to the DB config module (no @/ alias) so the CLI does not depend on
 * tsconfig-paths. Env vars are loaded by Node's --env-file-if-exists flag
 * before the CLI starts; no runtime dotenv loading is needed.
 */
import { registerAs } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { databaseConfig } from '../config';

const config = {
  type: 'postgres' as const,
  host: databaseConfig.host,
  port: databaseConfig.port,
  username: databaseConfig.username,
  password: databaseConfig.password,
  database: databaseConfig.database,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: false,
} satisfies TypeOrmModuleOptions & DataSourceOptions;

export default registerAs('typeorm', () => config);

/** Used by TypeORM CLI (migration:run, migration:generate, etc.). Single DataSource export so CLI resolves it without relying on default. */
export const connectionSource = new DataSource(config as DataSourceOptions);
