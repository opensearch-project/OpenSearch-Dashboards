/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import {
  BaseSelectors,
  StateAdapter,
} from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { CounterState } from './counter_state';

export class CounterSelectors extends BaseSelectors<CounterState> {
  constructor(adapterOrSubject: StateAdapter<CounterState> | BehaviorSubject<CounterState>) {
    super(adapterOrSubject);
  }
}
