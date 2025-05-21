/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StateAdapter, BehaviorSubjectAdapter, isStateAdapter } from './state_adapter';

type ChangeHandler = () => void;
interface ObservableLike<T> {
  getValue: () => T;
  subscribe: (observer: any) => { unsubscribe: () => void };
}

export abstract class BaseSelectors<T> {
  private changeHandlers: Set<ChangeHandler> = new Set();
  private rafHandle: number | undefined;
  private unsubscribe?: () => void;
  protected stateAdapter: StateAdapter<T>;

  constructor(adapterOrObservable: StateAdapter<T> | ObservableLike<T>) {
    if (isStateAdapter(adapterOrObservable)) {
      this.stateAdapter = adapterOrObservable;
    } else {
      this.stateAdapter = new BehaviorSubjectAdapter(adapterOrObservable as any);
    }

    // Subscribe to state changes and emit change notifications
    this.unsubscribe = this.stateAdapter.subscribe(() => {
      this.emitChange();
    });
  }

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

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.changeHandlers.clear();
  }

  public getState(): T {
    return this.stateAdapter.getState();
  }
}
