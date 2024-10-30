import { store } from '../store';
import { config } from '../config';
import { IConfig, IStore, TOrderRequest } from '../types';

class Api {
  private config: IConfig;
  private store: IStore;

  public constructor (config: IConfig, store: IStore) {
    this.config = config;
    this.store = store;
  }

  private async post (endpoint: string, data: Record<string, any>): Promise<any> {
    const url = `${this.config.getApiBaseUrl()}${endpoint}`;

    return new Promise((resolve, reject) => {
      fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.store.getAccessToken()}`,
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (response.status === 401) {
            throw new Error('Unauthorized');
          } else if (response.status !== 200) {
            throw response;
          }

          return response.json();
        })
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          console.warn(error);

          reject();
        });
    });
  }

  public async createOrder (order: TOrderRequest) {
    return await this.post('/order', order);
  }
}

export const api = new Api(config, store);
