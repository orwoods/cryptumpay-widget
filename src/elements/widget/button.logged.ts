import { ButtonCommon } from './button.common';

export class ButtonLogged extends ButtonCommon {
  public async init (): Promise<void> {
    const widgetPay = document.createElement('div');
    widgetPay.id = 'widget_pay';
    widgetPay.textContent = 'Pay';

    const widgetSettings = document.createElement('div');
    widgetSettings.id = 'widget_settings';

    const widgetPrice = document.createElement('div');
    widgetPrice.id = 'widget_price';
    widgetPrice.textContent = '100500 USDT';

    const widgetWallet = document.createElement('div');
    widgetWallet.id = 'widget_wallet';

    const walletSpan = document.createElement('span');
    walletSpan.textContent = '3TN…9FA';

    const arrowSpan = document.createElement('span');
    arrowSpan.innerHTML = '&#9662;';

    widgetWallet.appendChild(walletSpan);
    widgetWallet.appendChild(arrowSpan);

    widgetSettings.appendChild(widgetPrice);
    widgetSettings.appendChild(widgetWallet);

    this.registerRootItems([widgetPay, widgetSettings]);
  }
}
