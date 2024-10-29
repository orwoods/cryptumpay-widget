import { auth } from './auth';
import { ButtonConfig } from './buttonConfig';
import { CPayElement } from './element';

export class Button extends CPayElement {
  private config: ButtonConfig;

  constructor () {
    super();

    this.config = new ButtonConfig(() => this.update());
  }

  public getConfig () {
    return this.config;
  }

  public async createNew (elementId: string): Promise<void> {
    await auth.ready();

    this.create(this.findElement(elementId));
  }

  private create (container: HTMLElement): void {
    // TODO: оформляем в зависимости от первичных настроек
    // console.warn('update', this.config.getSettings());

    const widget = document.createElement('div');
    widget.id = 'widget';

    const widgetPay = document.createElement('div');
    widgetPay.id = 'widget_pay';
    widgetPay.className = 'wide';
    widgetPay.textContent = 'Pay with CryptumPay';

    widget.appendChild(widgetPay);
    container.appendChild(widget);
  }

  private update (): void {
    if (!auth.isReady) {
      return;
    }

    // TODO: обновляем внешку если изменили настройки в реалтайме
    // console.warn('update', this.config.getSettings());
  }
}
