export interface IConfig {
  getApiBaseUrl (): string;
  getJwtRefreshInterval (): number;
}

export interface IStore {
  forgetSensitiveData (): void;
  setAccessToken (accessToken: string): void;
  getAccessToken (): string | null;
}

export interface IAuth {
  get isLogged (): boolean;
  ready (): Promise<void>;
  logout (): Promise<boolean>;
}

export interface IStoreUnit {
  set (key: string, value: string): void;
  get (key: string): string | null;
  remove (key: string): void;
}

export type TStorage = 'localStorage';

export type TOrderRequest = {
  currency: string;
  amount: number;
  description: string;
  merchantId: string;
  customerId: string;
  orderId: string;
};

export type TJustCreatedOrder = {
  id: string;
};
