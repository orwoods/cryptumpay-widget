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

  public async init (): Promise<CPayElement> {
    await auth.ready();

    // TODO: оформляем в зависимости от первичных настроек
    // console.warn('update', this.config.getSettings());

    const widget = document.createElement('div');
    widget.id = 'widget';

    // TODO: revert
    if (!auth.isLogged) {
      this.addChild(await new ButtonLogged(widget).init(), widget);
    } else {
      this.addChild(await new ButtonAnonymous(widget).init(), widget);
    }

    this.registerRootItems([widget]);

    return this;
  }

  private update (): void {
    if (!auth.isReady) {
      return;
    }

    // TODO: обновляем внешку если изменили настройки в реалтайме
    // console.warn('update', this.config.getSettings());
  }
}
