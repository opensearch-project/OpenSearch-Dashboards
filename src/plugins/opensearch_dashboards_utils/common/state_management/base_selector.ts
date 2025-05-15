/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
type ChangeHandler = () => void;

export abstract class BaseSelectors<T> {
  private changeHandlers: Set<ChangeHandler> = new Set();
  private rafHandle: number | undefined;

  protected emitChange = () => {
    // Cancel any pending RAF to debounce multiple rapid changes
    if (this.rafHandle !== undefined) {
      cancelAnimationFrame(this.rafHandle);
    }

    // Schedule state update on next animation frame
    this.rafHandle = requestAnimationFrame(() => {
      this.changeHandlers.forEach((handler) => handler());
      this.rafHandle = undefined;
    });
  };

  public subscribe(onStoreChange: ChangeHandler): () => void {
    this.changeHandlers.add(onStoreChange);
    return () => {
      this.changeHandlers.delete(onStoreChange);
    };
  }

  public getSnapshot(): T {
    return this.getState();
  }

  public destroy(): void {
    if (this.rafHandle !== undefined) {
      cancelAnimationFrame(this.rafHandle);
    }
    this.changeHandlers.clear();
  }

  public abstract getState(): T;
}
