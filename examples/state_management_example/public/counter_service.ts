/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CounterActions, CounterSelectors, CounterState } from './state';

export class CounterService {
  private state$: BehaviorSubject<CounterState>;
  private selectors: CounterSelectors;
  private actions: CounterActions;

  constructor() {
    this.state$ = new BehaviorSubject<CounterState>({ count: 0 });
    this.actions = new CounterActions(this.state$);
    this.selectors = new CounterSelectors(this.state$);
  }

  public start() {
    return {
      state$: this.state$,
      actions: this.actions,
      selectors: this.selectors,
    };
  }

  public stop() {}
}
