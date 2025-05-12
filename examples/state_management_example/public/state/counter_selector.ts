/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { BaseSelectors } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { CounterState } from './counter_state';

export class CounterSelectors extends BaseSelectors<CounterState> {
  private state$: BehaviorSubject<CounterState>;

  constructor(state$: BehaviorSubject<CounterState>) {
    super();
    this.state$ = state$;

    // Subscribe to state changes and emit change notifications immediately
    this.state$.subscribe({
      next: () => {
        // Emit change to notify all subscribers
        this.emitChange();
      },
    });
  }

  public getState(): CounterState {
    return this.state$.getValue();
  }
}
