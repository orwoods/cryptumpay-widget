import { StoreUnit } from '../storeUnit';
import { IStoreUnit } from '../../types';

export class MemoryStorageStoreUnit extends StoreUnit implements IStoreUnit {
  private items: Record<string, string> = {};

  public set (key: string, value: string): void {
    this.items[key] = value;
  }

  public get (key: string): string | null {
    return this.items[key] || null;
  }

  public remove (key: string): void {
    delete this.items[key];
  }
}
