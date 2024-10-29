// @ts-ignore
import styles from 'sass:./styles.css';

export const addStyles = (): void => {
  const style = document.createElement('style');
  style.textContent = styles;

  document.head.appendChild(style);
};
