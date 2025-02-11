import { AccessDeniedError } from '../errors/accessDenied';
import { BasicError } from '../errors/basicError';
import { api } from '../api';
import { config } from '../config';
import { store } from '../store';
import { IConfig, IStore, IAuth } from '../types';

class Auth implements IAuth {
  private config: IConfig;
  private store: IStore;

  private logged = false;
  private isInitialization = false;
  private initialized = false;
  private onReady: ((value: void) => void)[];
  private autoRefreshToken?: ReturnType<typeof setInterval>;

  public constructor (config: IConfig, store: IStore) {
    this.config = config;
    this.store = store;
    this.onReady = [];
  }

  public get isLogged (): boolean {
    return this.logged;
  }

  public get isReady (): boolean {
    return this.initialized;
  }

  public async ready (): Promise<void> {
    if (this.initialized) {
      return;
    }

    const promise = new Promise<void>((resolve) => {
      this.onReady.push(resolve);
    });

    if (!this.isInitialization) {
      this.isInitialization = true;

      this.init();
    }

    return promise;
  }

  public unload () {
    this.logged = false;
    this.isInitialization = false;
    this.initialized = false;

    this.store.forgetSensitiveData();
  }

  private async init (): Promise<void> {
    await this.refreshToken();

    this.initialized = true;
    this.isInitialization = false;

    for (const resolve of this.onReady) {
      resolve();
    }
  }

  public async refreshToken (): Promise<void> {
    if (this.autoRefreshToken) {
      clearInterval(this.autoRefreshToken);
    }

    try {
      const data = await api.refreshJwtToken();
      if (!data?.accessToken) {
        throw new BasicError('Invalid response');
      }

      this.logged = true;
      this.store.setAccessToken(data.accessToken);
      this.autoRefreshToken = setInterval(() => this.refreshToken(), this.config.getJwtRefreshInterval());
    } catch (err) {
      if (err instanceof AccessDeniedError) {
        this.logged = false;
        this.store.forgetSensitiveData();
      } else {
        console.warn(err);
      }
    }
  }

  public async logout (): Promise<boolean> {
    const url = `${this.config.getApiBaseUrl()}/auth/logout`;

    return new Promise((resolve) => {
      fetch(url, { method: 'POST', credentials: 'include' })
        .then(response => response.json())
        .then((data) => {
          this.logged = false;
          this.store.forgetSensitiveData();

          resolve(true);
        })
        .catch((error) => {
          console.warn(error);

          resolve(false);
        });
    });
  }
}

export const auth = new Auth(config, store);
