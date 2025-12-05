/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { StateAdapter, BehaviorSubjectAdapter, isStateAdapter } from './state_adapter';

/*
 * @experimental
 */
export abstract class BaseActions<T> {
  protected stateAdapter: StateAdapter<T>;
  protected state$?: BehaviorSubject<T>; // Keep for backward compatibility

  constructor(adapterOrSubject: StateAdapter<T> | BehaviorSubject<T>) {
    if (isStateAdapter(adapterOrSubject)) {
      this.stateAdapter = adapterOrSubject;
    } else {
      const subject = adapterOrSubject as BehaviorSubject<T>;
      this.state$ = subject; // Store for backward compatibility
      this.stateAdapter = new BehaviorSubjectAdapter(subject);
    }
  }

  protected updateState(updater: (prevState: T) => T) {
    this.stateAdapter.setState(updater);
  }
}
