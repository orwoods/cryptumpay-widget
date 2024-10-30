import { auth } from '../services/auth';
import { dom } from '../services/dom';
import { CPayElement } from './element';

export class Root extends CPayElement {
  private static RegisteredIds = new Set<string>();
  private rootId: string;

  constructor (rootId: string) {
    if (Root.RegisteredIds.has(rootId)) {
      throw new Error(`Id ${rootId} is already in use`);
    }

    super(dom.findElement(rootId));

    Root.RegisteredIds.add(rootId);

    this.rootId = rootId;
  }

  public async init () {
    await auth.ready();
  }

  public unload (): void {
    Root.RegisteredIds.delete(this.rootId);
  }
}
