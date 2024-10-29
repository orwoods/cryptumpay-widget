export class CPayElement {
  public findElement (elementId: string): HTMLElement {
    const container = document.getElementById(elementId);
    if (container) {
      return container;
    }

    throw new Error(`Unknown element ${elementId}.`);
  }
}
