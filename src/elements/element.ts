import { dom } from '../services/dom';

export class CPayElement {
  protected container?: HTMLElement;
  protected rootItem?: HTMLElement;
  protected parent?: CPayElement;
  private childs: CPayElement[] = [];

  constructor (container?: HTMLElement) {
    this.container = container;
  }

  public async init () {
  }

  public unload () {
  }

  public cascadeUnload () {
    this.childs.forEach((child) => child.cascadeUnload());
    this.childs = [];

    this.unload();

    this.parent = undefined;
    this.container = undefined;
    this.rootItem = undefined;
  }

  public setParent (parent: CPayElement) {
    this.parent = parent;
  }

  protected setContainer (container: HTMLElement) {
    this.container = container;
  }

  protected registerRootItem (rootItem: HTMLElement) {
    this.rootItem = rootItem;
  }

  public getParent (): CPayElement | undefined {
    return this.parent;
  }

  public getContainer (): HTMLElement | undefined {
    return this.container;
  }

  public getRootItem (): HTMLElement | undefined {
    return this.rootItem;
  }

  public addChild (child: CPayElement, container?: HTMLElement) {
    container = container || this.container;
    if (!container) {
      throw new Error('Container was not set');
    }

    const rootItem = child.getRootItem();
    if (!rootItem) {
      throw new Error('Root item was not set');
    }

    this.childs.push(child);
    child.setParent(this);

    dom.injectElement(container, rootItem);
  }
}
