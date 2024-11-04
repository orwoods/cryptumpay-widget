import { auth } from './services/auth';
import { dom } from './services/dom';
import { Widget } from './elements/widget';
import { Root } from './elements/root';
import { api } from './api';

export const create = async (id: string) => {
  const root = new Root(id);
  const widget = new Widget();

  dom.injectStyles();

  await Promise.all([root.init(), widget.init()]);

  root.addChild(widget);

  return {
    remove: () => {
      root.cascadeUnload();
      dom.unload();
      auth.unload();
    },
    config: widget.getConfig(),
    api: {
      getCurrencies: () => api.getCurrencies(),
    },
  };
};
