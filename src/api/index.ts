import { store } from '../store';
import { config } from '../config';
import { IConfig, IStore, TJustCreatedOrder, TNewJwtToken, TOrderRequest } from '../types';
import { BasicError } from '../errors/basicError';
import { AccessDeniedError } from '../errors/accessDenied';

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

    if (withAuthorization && this.store.getAccessToken()) {
      requestParams.headers = {
        ...requestParams.headers,
        Authorization: `Bearer ${this.store.getAccessToken()}`,
      };
    }

    try {
      const response = await fetch(url, requestParams);

      if (response.status === 401) {
        throw new AccessDeniedError('Unauthorized request');
      } else if (response.status !== 200) {
        throw new BasicError('Response code is not 200');
      }

      return await response.json();
    } catch (err) {
      if (err instanceof BasicError) {
        throw err;
      }

      console.warn(err);

      throw new BasicError('Unexpected error');
    }
  }

  public async refreshJwtToken () {
    return await this.request<TNewJwtToken>({
      endpoint: '/auth/refresh-token',
      method: 'POST',
      withAuthorization: false,
      withCredentials: true,
    });
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
