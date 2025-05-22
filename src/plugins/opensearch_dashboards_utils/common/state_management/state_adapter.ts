/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable max-classes-per-file */
import { BehaviorSubject } from 'rxjs';

/**
 * @experimental
 * StateAdapter provides a common interface for various state management backends.
 * Implementations can wrap Redux Store slices, BehaviorSubjects, or other state containers.
 */
export interface StateAdapter<T> {
  /**
   * Gets the current state
   */
  getState(): T;

  /**
   * Updates the state using an updater function
   */
  setState(updater: (prevState: T) => T): void;

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: T) => void): () => void;
}

/**
 * @experimental
 * Adapter implementation for BehaviorSubject-based state
 */
export class BehaviorSubjectAdapter<T> implements StateAdapter<T> {
  constructor(private state$: BehaviorSubject<T>) {}

  getState(): T {
    return this.state$.getValue();
  }

  setState(updater: (prevState: T) => T): void {
    const current = this.state$.getValue();
    const updated = updater(current);
    this.state$.next(updated);
  }

  subscribe(listener: (state: T) => void): () => void {
    const subscription = this.state$.subscribe(listener);
    return () => subscription.unsubscribe();
  }
}

/**
 * @experimental
 * Adapter implementation for Redux store slices
 */
export class ReduxStoreAdapter<T, S = any> implements StateAdapter<T> {
  constructor(
    private store: {
      getState: () => S;
      dispatch: (action: any) => void;
      subscribe: (listener: () => void) => () => void;
    },
    private stateSelector: (state: S) => T,
    private createAction: (updater: (state: T) => T) => any
  ) {}

  getState(): T {
    return this.stateSelector(this.store.getState());
  }

  setState(updater: (prevState: T) => T): void {
    this.store.dispatch(this.createAction(updater));
  }

  subscribe(listener: (state: T) => void): () => void {
    let currentState = this.getState();

    return this.store.subscribe(() => {
      const nextState = this.getState();
      // Only call listener if the selected state has changed
      if (nextState !== currentState) {
        currentState = nextState;
        listener(nextState);
      }
    });
  }
}

/**
 * @experimental
 * Type guard to check if an object is a StateAdapter
 */
export function isStateAdapter<T>(obj: any): obj is StateAdapter<T> {
  return (
    obj &&
    typeof obj.getState === 'function' &&
    typeof obj.setState === 'function' &&
    typeof obj.subscribe === 'function'
  );
}
