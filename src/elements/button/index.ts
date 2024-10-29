import { auth } from '../../services/auth';
import { ButtonConfig } from './config';
import { CPayElement } from '../element';

export class Button extends CPayElement {
  private config: ButtonConfig;

  constructor () {
    super();

    this.config = new ButtonConfig(() => this.update());
  }

  public async init () {
    await this.create();
  }

  public getConfig () {
    return this.config;
  }

  private async create (): Promise<void> {
    // TODO: оформляем в зависимости от первичных настроек
    // console.warn('update', this.config.getSettings());

    const widget = document.createElement('div');
    widget.id = 'widget';

    const widgetPay = document.createElement('div');
    widgetPay.id = 'widget_pay';
    widgetPay.className = 'wide';
    widgetPay.textContent = 'Pay with CryptumPay';

    widget.appendChild(widgetPay);

    this.registerRootItem(widget);
  }

  private update (): void {
    if (!auth.isReady) {
      return;
    }

    // TODO: обновляем внешку если изменили настройки в реалтайме
    // console.warn('update', this.config.getSettings());
  }
}
