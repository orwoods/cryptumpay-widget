import { dom } from '../services/dom';

export class CPayElement {
  private static maxId = 0;

  private readonly id = ++CPayElement.maxId;
  protected container?: HTMLElement;
  protected rootItems: HTMLElement[] = [];
  protected parent?: CPayElement;
  private childs = new Map<number, CPayElement>();

  constructor (container?: HTMLElement) {
    this.container = container;
  }

  public async init (): Promise<void> {
  }

  public unload () {
  }

  public cascadeUnload () {
    this.childs.forEach((child) => this.removeChild(child));

    this.unload();

    this.parent = undefined;
    this.container = undefined;
    this.rootItems = [];
  }

  public setParent (parent?: CPayElement) {
    this.parent = parent;
  }

  protected setContainer (container?: HTMLElement) {
    this.container = container;
  }

  protected registerRootItems (rootItems: HTMLElement[]) {
    this.rootItems = rootItems;
  }

  public getParent (): CPayElement | undefined {
    return this.parent;
  }

  public getContainer (): HTMLElement | undefined {
    return this.container;
  }

  public getRootItems (): HTMLElement[] {
    return this.rootItems;
  }

  public addChild (child: CPayElement, container?: HTMLElement) {
    container = container || this.container;
    if (!container) {
      throw new Error('Container was not set');
    }

    const rootItems = child.getRootItems();
    if (!rootItems.length) {
      throw new Error('Root items was not set');
    }

    this.childs.set(child.id, child);

    child.setParent(this);
    child.setContainer(container);

    for (const item of rootItems) {
      dom.injectElement(container, item);
    }
  }

  public beforeRemoveChild (child: CPayElement) {
  }

  public removeChild (child: CPayElement) {
    const rootItems = child.getRootItems();
    if (!rootItems.length) {
      throw new Error('Root items was not set');
    }

    this.beforeRemoveChild(child);

    child.cascadeUnload();
    child.setParent();
    child.setContainer();

    for (const item of rootItems) {
      item.remove();
    }

    this.childs.delete(child.id);
  }

  public remove () {
    const parent = this.getParent();
    if (parent) {
      parent.removeChild(this);
    }
  }
}
