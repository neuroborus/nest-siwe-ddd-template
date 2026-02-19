import { NodeEnv } from './node-env.enum';
import { authConfig } from './auth.config';
import { envOrDefault, requireEnv } from './envs';

const DEFAULT_PORT = '3000';
const DEFAULT_LOG_LEVEL = 'info';

const port = envOrDefault('PORT', DEFAULT_PORT, {
  warnOnDefault: true,
});
const logLevel = envOrDefault('LOG_LEVEL', DEFAULT_LOG_LEVEL, {
  warnOnDefault: true,
}).toLowerCase();

const nodeEnvStr = requireEnv('NODE_ENV');
const envList = Object.values(NodeEnv) as string[];
let nodeEnv: NodeEnv;
if (nodeEnvStr === 'test') {
  nodeEnv = NodeEnv.Dev;
} else if (!envList.includes(nodeEnvStr)) {
  throw new Error(
    `NODE_ENV must be one of the following values: ${JSON.stringify(envList)}\n` +
      `Provided: ${JSON.stringify(nodeEnvStr)}`,
  );
} else {
  nodeEnv = nodeEnvStr as NodeEnv;
}

export const staticConfig = {
  port,
  logLevel,
  nodeEnv,
  auth: authConfig,
} as const;
