/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BehaviorSubject } from 'rxjs';
import { BaseActions } from '../../../../../opensearch_dashboards_utils/public';
import { TestState } from './test_state';

export class TestActions extends BaseActions<TestState> {
  constructor(state$: BehaviorSubject<TestState>) {
    super(state$);
  }

  public increment(): void {
    this.updateState((state) => ({
      ...state,
      value: state.value + 1,
    }));
  }
}
