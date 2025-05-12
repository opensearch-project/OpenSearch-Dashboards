/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { BaseActions } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { CounterState } from './counter_state';

export class CounterActions extends BaseActions<CounterState> {
  constructor(state$: BehaviorSubject<CounterState>) {
    super(state$);
  }

  public increment(): void {
    const currentState = this.state$.getValue();
    this.updateState((state) => ({
      ...state,
      count: currentState.count + 1,
    }));
  }

  public decrement(): void {
    const currentState = this.state$.getValue();
    this.updateState((state) => ({
      ...state,
      count: currentState.count - 1,
    }));
  }

  public reset(): void {
    this.updateState((state) => ({
      ...state,
      count: 0,
    }));
  }
}
