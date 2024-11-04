import { store } from '../store';
import { config } from '../config';
import { IConfig, IStore, TJustCreatedOrder, TOrderRequest } from '../types';

export type TRequestParams = {
  endpoint: string;
  data?: Record<string, any>;
  method?: 'POST' | 'GET' | 'PUT' | 'DELETE';
  withCredentials?: boolean;
  withAuthorization?: boolean;
};

class Api {
  private config: IConfig;
  private store: IStore;

  public constructor (config: IConfig, store: IStore) {
    this.config = config;
    this.store = store;
  }

  private async request <T> ({
    endpoint,
    method = 'GET',
    data = {},
    withCredentials = false,
    withAuthorization = true,
  }: TRequestParams): Promise<T> {
    const url = new URL(`${this.config.getApiBaseUrl()}${endpoint}`);

    const requestParams: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method === 'GET') {
      Object.keys(data).forEach((key) => url.searchParams.append(key, data[key]));
    } else {
      requestParams.body = JSON.stringify(data);
    }

    if (withCredentials) {
      requestParams.credentials = 'include';
    }

    if (withAuthorization) {
      requestParams.headers = {
        ...requestParams.headers,
        Authorization: `Bearer ${this.store.getAccessToken()}`,
      };
    }

    try {
      const response = await fetch(url, requestParams);

      if (response.status === 401) {
        throw new Error('Unauthorized request');
      } else if (response.status !== 200) {
        throw new Error('Response code is not 200');
      }

      return await response.json();
    } catch (error) {
      console.warn(error);

      throw new Error('Unexpected error');
    }
  }

  public async createOrder (order: TOrderRequest) {
    return await this.request<TJustCreatedOrder>({
      endpoint: '/order',
      method: 'POST',
      data: order,
      withAuthorization: true,
      withCredentials: true,
    });
  }

  public async getUser () {
    return await this.request({
      endpoint: '/user',
      withAuthorization: true,
    });
  }

  public async getCurrencies () {
    const result = await this.request<{ currencies: string[] }>({
      endpoint: '/currencies',
    });

    return result?.currencies || [];
  }
}

export const api = new Api(config, store);
