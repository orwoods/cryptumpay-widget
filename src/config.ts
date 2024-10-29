import { IConfig } from './types';

class Config implements IConfig {
  getApiBaseUrl (): string {
    return 'http://api.cryptumpay.local';
  }
}

export const config = new Config();
