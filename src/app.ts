import { auth } from './services/auth';
import { dom } from './services/dom';
import { Button } from './elements/button';
import { Root } from './elements/root';

export const create = async (id: string) => {
  const root = new Root(id);
  const button = new Button();

  dom.injectStyles();

  await Promise.all([root.init(), button.init()]);

  root.addChild(button);

  return {
    remove: () => {
      root.cascadeUnload();
      dom.unload();
      auth.unload();
    },
    config: button.getConfig(),
  };
};
