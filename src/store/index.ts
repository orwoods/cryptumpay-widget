import { MemoryStorageStoreUnit } from './storages/memoryStorageStoreUnit';
import { IStore } from '../types';

class Store implements IStore {
  private auth: MemoryStorageStoreUnit;

  constructor () {
    this.auth = new MemoryStorageStoreUnit('auth');
  }

  setAccessToken (accessToken: string): void {
    this.auth.set('jwtAccessToken', accessToken);
  }

  getAccessToken (): string | null {
    return this.auth.get('jwtAccessToken');
  }

  forgetSensitiveData (): void {
    this.auth.remove('jwtAccessToken');
  }
}

export const store = new Store();
