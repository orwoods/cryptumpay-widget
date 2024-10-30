import { auth } from '../../services/auth';
import { WidgetConfig } from './config';
import { CPayElement } from '../element';
import { ButtonAnonymous } from './button.anonymous';
import { ButtonLogged } from './button.logged';

export class Widget extends CPayElement {
  private config: WidgetConfig;

  constructor () {
    super();

    this.config = new WidgetConfig(() => this.update());
  }

  public getConfig () {
    return this.config;
  }

  public async init (): Promise<void> {
    await auth.ready();

    // TODO: оформляем в зависимости от первичных настроек
    // console.warn('update', this.config.getSettings());

    const widget = document.createElement('div');
    widget.id = 'widget';

    if (auth.isLogged) {
      this.addChild(await this.createLoggedButton(), widget);
    } else {
      this.addChild(await this.createAnonymousButton(), widget);
    }

    this.registerRootItems([widget]);
  }

  private async createLoggedButton () {
    const button = new ButtonLogged(this.config);
    await button.init();

    return button;
  }

  private async createAnonymousButton () {
    const button = new ButtonAnonymous(this.config);
    await button.init();

    return button;
  }

  private update (): void {
    if (!auth.isReady) {
      return;
    }

    // TODO: обновляем внешку если изменили настройки в реалтайме
    // console.warn('update', this.config.getSettings());
  }
}
