/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CounterActions, CounterSelectors, CounterServiceFactory } from './state';

export class ObservableBasedCounterService {
  private selectors: CounterSelectors;
  private actions: CounterActions;
  private state$?: BehaviorSubject<any>; // Only used with Observable pattern

  constructor() {
    const { actions, selectors, state$ } = CounterServiceFactory.createObservableCounter(0);
    this.actions = actions;
    this.selectors = selectors;
    this.state$ = state$;
  }

  public start() {
    return {
      state$: this.state$, // Will be undefined when using Redux
      actions: this.actions,
      selectors: this.selectors,
    };
  }

  public stop() {}
}
