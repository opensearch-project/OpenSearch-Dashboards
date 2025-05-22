/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import {
  BaseActions,
  StateAdapter,
} from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { CounterState } from './counter_state';

export class CounterActions extends BaseActions<CounterState> {
  constructor(adapterOrSubject: StateAdapter<CounterState> | BehaviorSubject<CounterState>) {
    super(adapterOrSubject);
  }

  public increment(): void {
    this.updateState((state) => ({
      ...state,
      count: state.count + 1,
    }));
  }

  public decrement(): void {
    this.updateState((state) => ({
      ...state,
      count: state.count - 1,
    }));
  }

  public reset(): void {
    this.updateState((state) => ({
      ...state,
      count: 0,
    }));
  }
}
