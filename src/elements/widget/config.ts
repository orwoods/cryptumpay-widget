export class WidgetConfig {
  #callback: () => void;

  #orderId?: string;
  #customerId?: string;
  #merchantId?: string;
  #amount?: number;
  #canEditAmount?: boolean;
  #currency?: string;
  #description?: string;
  #orderType?: number;

  constructor (callback: () => void) {
    this.#callback = callback;
  }

  public setOrderId (value: string) {
    if (this.#orderId === value) {
      return;
    }

    this.#orderId = value;

    this.#callback();
  }

  public setCustomerId (value: string) {
    if (this.#customerId === value) {
      return;
    }

    this.#customerId = value;

    this.#callback();
  }

  public setMerchantId (value: string) {
    if (this.#merchantId === value) {
      return;
    }

    this.#merchantId = value;

    this.#callback();
  }

  public setPrice (amount: number, currency: string, canEditAmount: boolean) {
    if (this.#amount === amount && this.#currency === currency && this.#canEditAmount === canEditAmount) {
      return;
    }

    this.#amount = amount;
    this.#currency = currency;
    this.#canEditAmount = canEditAmount;

    this.#callback();
  }

  public setDescription (value: string) {
    if (this.#description === value) {
      return;
    }

    this.#description = value;

    this.#callback();
  }

  public setOrderType (type: number) {
    if (this.#orderType === type) {
      return;
    }

    if (isNaN(Number(type)) || type < 0) {
      console.warn('Invalid order type');

      return;
    }

    this.#orderType = type;

    this.#callback();
  }

  public getSettings () {
    return {
      orderId: this.#orderId,
      customerId: this.#customerId,
      merchantId: this.#merchantId,
      amount: this.#amount,
      canEditAmount: this.#canEditAmount,
      currency: this.#currency,
      description: this.#description,
      orderType: this.#orderType,
    };
  }
}
