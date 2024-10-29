import { StoreUnit } from '../storeUnit';
import { IStoreUnit } from '../../types';

export class CookieStoreUnit extends StoreUnit implements IStoreUnit {
  public set (key: string, value: string, days = 7): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    key = this.key(key);
    value = encodeURIComponent(value);
    document.cookie = `${key}=${value}; expires=${expires.toUTCString()}; path=/; Secure; SameSite=Strict`;
  }

  public get (key: string): string | null {
    const nameEQ = `${this.key(key)}=`;
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(nameEQ)) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  }

  public remove(key: string): void {
    this.set(key, '', -1);
  }
}
