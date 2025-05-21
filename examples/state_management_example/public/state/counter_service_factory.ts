/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { CounterState } from './counter_state';
import { CounterActions } from './counter_actions';
import { CounterSelectors } from './counter_selector';
import { createReduxCounterAdapter } from './redux_counter_service';

/**
 * Example service that exposes both Observable and Redux-based implementations
 */
export class CounterServiceFactory {
  /**
   * Creates a counter service instance using BehaviorSubject (Observable pattern)
   */
  public static createObservableCounter(initialCount: number = 0) {
    const state$ = new BehaviorSubject<CounterState>({ count: initialCount });
    const actions = new CounterActions(state$);
    const selectors = new CounterSelectors(state$);

    return { actions, selectors, state$ };
  }

  /**
   * Creates a counter service instance using Redux store
   */
  public static createReduxCounter() {
    const stateAdapter = createReduxCounterAdapter();
    const actions = new CounterActions(stateAdapter);
    const selectors = new CounterSelectors(stateAdapter);

    return { actions, selectors };
  }
}
