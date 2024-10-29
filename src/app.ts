import { Button } from './button';
import { addStyles } from './style';

addStyles();

export const button = (id: string) => {
  const button = new Button();

  button.createNew(id);

  return button.getConfig();
};
