import { Button } from './button';
import { addStyles } from './style';

addStyles();

export const button = async (id: string): Promise<void> => {
  const button = new Button();
  await button.create(id);
};
