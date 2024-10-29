export abstract class StoreUnit {
  protected name: string;

  constructor (name: string) {
    this.name = name;
  }

  protected key (key: string): string {
    return `${this.name}:${key}`;
  }
}
