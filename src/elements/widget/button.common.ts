import { api } from '../../api';
import { auth } from '../../services/auth';
import { CPayElement } from '../element';
import { OrderPopup } from '../orderPopup';
import { WidgetConfig } from './config';

export abstract class ButtonCommon extends CPayElement {
  protected button!: HTMLElement;
  protected clicked = false;
  private locked = false;
  private config: WidgetConfig;

  constructor (config: WidgetConfig) {
    super();

    this.config = config;
  }

  protected async click () {
    if (this.clicked || this.locked) {
      return;
    }

    this.clicked = true;

    try {
      await this.createOrder();
    } catch (error) {
      console.warn('ButtonCommon error', error);
    }

    this.clicked = false;
  }

  private async createOrder () {
    try {
      const settings = this.config.getSettings();

      const data = await api.createOrder({
        currency: settings.currency || '',
        amount: settings.amount || 0,
        description: settings.description || '',
        merchantId: settings.merchantId || '',
        customerId: settings.customerId || '',
        clientOrderId: settings.clientOrderId || '',
      });

      console.warn('order result:');
      console.warn(data);

      const orderId = '100500';

      this.locked = true;

      await auth.refreshToken();

      this.addChild(await this.openOrderPopup(orderId), this.getContainer());
    } catch {
      const oldText = this.button.textContent;
      this.button.textContent = '😞';

      setTimeout(() => {
        this.button.textContent = oldText;
        this.locked = false;
      }, 3000);
    }
  }

  private async openOrderPopup (orderId: string) {
    const popup = new OrderPopup();
    await popup.init();

    return popup;
  }

  public beforeRemoveChild (child: CPayElement): void {
    this.locked = false;
  }
}
