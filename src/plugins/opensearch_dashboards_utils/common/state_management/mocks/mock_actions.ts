/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseActions } from '../base_action';

export class TestActions extends BaseActions<{ counter: number }> {
  increment() {
    this.updateState((state) => ({
      ...state,
      counter: state.counter + 1,
    }));
  }

  decrement() {
    this.updateState((state) => ({
      ...state,
      counter: state.counter - 1,
    }));
  }

  reset() {
    this.updateState(() => ({
      counter: 0,
    }));
  }
}
