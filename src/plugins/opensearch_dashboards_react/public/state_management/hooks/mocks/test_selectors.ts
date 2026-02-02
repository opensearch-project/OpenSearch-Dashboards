/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { TestState } from './test_state';
import { BaseSelectors } from '../../../../../opensearch_dashboards_utils/public';

export class TestSelectors extends BaseSelectors<TestState> {
  constructor(state$: BehaviorSubject<TestState>) {
    super(state$);
  }

  // BaseSelectors now implements getState() for us using the stateAdapter
}
