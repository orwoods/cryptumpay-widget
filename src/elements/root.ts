import { auth } from '../services/auth';
import { dom } from '../services/dom';
import { CPayElement } from './element';

export class Root extends CPayElement {
  private static RegisteredIds = new Set<string>();
  private id: string;

  constructor (id: string) {
    if (Root.RegisteredIds.has(id)) {
      throw new Error(`Id ${id} is already in use`);
    }

    super(dom.findElement(id));

    Root.RegisteredIds.add(id);

    this.id = id;
  }

  public async init (): Promise<CPayElement> {
    await auth.ready();

    return this;
  }

  public unload (): void {
    Root.RegisteredIds.delete(this.id);
  }
}
