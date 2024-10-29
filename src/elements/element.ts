import { dom } from '../services/dom';

export class CPayElement {
  protected container?: HTMLElement;
  protected rootItems: HTMLElement[] = [];
  protected parent?: CPayElement;
  private childs: CPayElement[] = [];

  constructor (container?: HTMLElement) {
    this.container = container;
  }

  public async init (): Promise<CPayElement> {
    return this;
  }

  public unload () {
  }

  public cascadeUnload () {
    this.childs.forEach((child) => child.cascadeUnload());
    this.childs = [];

    this.unload();

    this.parent = undefined;
    this.container = undefined;
    this.rootItems = [];
  }

  public setParent (parent: CPayElement) {
    this.parent = parent;
  }

  protected setContainer (container: HTMLElement) {
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

    this.childs.push(child);
    child.setParent(this);
    child.setContainer(container);

    for (const rootItem of rootItems) {
      dom.injectElement(container, rootItem);
    }
  }
}
