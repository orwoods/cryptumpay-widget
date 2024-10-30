import { ButtonCommon } from './button.common';

export class ButtonAnonymous extends ButtonCommon {
  public async init (): Promise<void> {
    const widgetPay = document.createElement('div');
    widgetPay.id = 'widget_pay';
    widgetPay.className = 'wide';
    widgetPay.textContent = 'Pay with CryptumPay';

    this.button = widgetPay;

    widgetPay.addEventListener('click', this.click.bind(this));

    this.registerRootItems([widgetPay]);
  }
}
