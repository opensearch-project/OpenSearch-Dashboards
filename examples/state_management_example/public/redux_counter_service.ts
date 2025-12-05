/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CounterActions, CounterSelectors, CounterServiceFactory } from './state';

export class ReduxBasedCounterService {
  private selectors: CounterSelectors;
  private actions: CounterActions;
  private state$?: BehaviorSubject<any>; // Only used with Observable pattern

  constructor() {
    const { actions, selectors } = CounterServiceFactory.createReduxCounter();
    this.actions = actions;
    this.selectors = selectors;
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
