import { CPayElement } from './element';

export class OrderPopup extends CPayElement {
  public async init (): Promise<void> {
    const popup = document.createElement('div');
    popup.id = 'order_popup';

    this.registerRootItems([popup]);
  }
}
