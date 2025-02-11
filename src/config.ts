import { IConfig } from './types';

class Config implements IConfig {
  getApiBaseUrl (): string {
    return 'https://api.home.cryptumpay.com';
  }

  getJwtRefreshInterval (): number {
    return 30 * 1000;
  }
}

export const config = new Config();
