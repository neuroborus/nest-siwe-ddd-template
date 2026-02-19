import { staticConfig } from './static-config';

export const configuration = (): typeof staticConfig => {
  return staticConfig;
};
