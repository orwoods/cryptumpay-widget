import { getStyles } from '../style';

class Dom {
  private injectedTags: HTMLElement[] = [];

  public injectElement (container: HTMLElement, element: HTMLElement): void {
    container.appendChild(element);

    this.injectedTags.push(element);
  }

  public injectStyles (): void {
    const tag = document.createElement('style');
    tag.textContent = getStyles();

    this.injectElement(document.head, tag);
  }

  public findElement (elementId: string): HTMLElement {
    const container = document.getElementById(elementId);
    if (container) {
      return container;
    }

    throw new Error(`Unknown element ${elementId}.`);
  }

  public unload () {
    for (const tag of this.injectedTags.reverse()) {
      if (tag) {
        tag.remove();
      }
    }

    this.injectedTags = [];
  }
}

export const dom = new Dom();
