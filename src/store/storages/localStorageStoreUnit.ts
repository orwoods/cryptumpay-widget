import { StoreUnit } from '../storeUnit';
import { IStoreUnit } from '../../types';

export class LocalStorageStoreUnit extends StoreUnit implements IStoreUnit {
  public set (key: string, value: string): void {
    localStorage.setItem(this.key(key), value);
  }

  public get (key: string): string | null {
    return localStorage.getItem(this.key(key));
  }

  public remove (key: string): void {
    localStorage.removeItem(this.key(key));
  }
}
