import { envOrDefault, requireEnv } from './envs';

const DEFAULT_DB_PASSWORD = '';
const DEFAULT_DB_PORT = '5432';

const dbHost = requireEnv('DB_HOST');
const dbName = requireEnv('DB_NAME');
const dbUser = requireEnv('DB_USER');
const dbPassword = envOrDefault('DB_PASSWORD', DEFAULT_DB_PASSWORD, {
  warnOnDefault: true,
});
const dbPort = envOrDefault('DB_PORT', DEFAULT_DB_PORT, {
  warnOnDefault: true,
});

export const databaseConfig = {
  host: dbHost,
  port: parseInt(dbPort, 10),
  username: dbUser,
  password: dbPassword,
  database: dbName,
} as const;
