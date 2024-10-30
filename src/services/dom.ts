import { getStyles } from '../style';

class Dom {
  private styles?: HTMLElement;

  public injectElement (container: HTMLElement, element: HTMLElement): void {
    container.appendChild(element);
  }

  public injectStyles (): void {
    const tag = document.createElement('style');
    tag.textContent = getStyles();

    this.injectElement(document.head, tag);

    this.styles = tag;
  }

  public findElement (elementId: string): HTMLElement {
    const container = document.getElementById(elementId);
    if (container) {
      return container;
    }

    throw new Error(`Unknown element ${elementId}.`);
  }

  public unload () {
    if (this.styles) {
      this.styles.remove();
    }
  }
}

export const dom = new Dom();
