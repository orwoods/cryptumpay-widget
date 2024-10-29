import { IConfig } from './types';

class Config implements IConfig {
  getApiBaseUrl (): string {
    return 'http://api.cryptumpay.local';
  }

  getJwtRefreshInterval (): number {
    return 30 * 1000;
  }
}

export const config = new Config();
