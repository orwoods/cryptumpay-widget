import { CPayElement } from '../element';

export class ButtonAnonymous extends CPayElement {
  public async init (): Promise<CPayElement> {
    const widgetPay = document.createElement('div');
    widgetPay.id = 'widget_pay';
    widgetPay.className = 'wide';
    widgetPay.textContent = 'Pay with CryptumPay';

    this.registerRootItem(widgetPay);

    return this;
  }
}
