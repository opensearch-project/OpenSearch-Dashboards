/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { TestState } from './test_state';
import { BaseSelectors } from '../../../../../opensearch_dashboards_utils/public';

export class TestSelectors extends BaseSelectors<TestState> {
  private state$: BehaviorSubject<TestState>;

  constructor(state$: BehaviorSubject<TestState>) {
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

  public getState(): TestState {
    return this.state$.getValue();
  }
}
