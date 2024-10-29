import { auth } from './auth';
import { CPayElement } from './element';

export class Button extends CPayElement {
  public async create (elementId: string): Promise<void> {
    await auth.ready();

    this.createNew(this.findElement(elementId));
  }

  private createNew (container: HTMLElement): void {
    const widget = document.createElement('div');
    widget.id = 'widget';

    const widgetPay = document.createElement('div');
    widgetPay.id = 'widget_pay';
    widgetPay.className = 'wide';
    widgetPay.textContent = 'Pay with CryptumPay';

    widget.appendChild(widgetPay);
    container.appendChild(widget);
  }
}
