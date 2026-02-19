import { randomUUID } from 'crypto';
import { NodeEnv, staticConfig } from '@/config';

export const pinoHttp = {
  level: staticConfig.logLevel,
  genReqId: () => randomUUID(),
  // Hide concrete headers/fields
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'req.body.signature',
      'res.body.accessToken',
      'res.body.refreshToken',
    ],
    censor: '***',
  },

  transport:
    staticConfig.nodeEnv === NodeEnv.Dev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l o',
            singleLine: true,
            levelFirst: true,
            ignore: 'pid,hostname,context',
            messageFormat: '{context} => {msg}',
          },
        }
      : undefined,
};
