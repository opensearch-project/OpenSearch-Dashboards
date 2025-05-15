/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';

export abstract class BaseActions<T> {
  protected state$: BehaviorSubject<T>;

  constructor(state$: BehaviorSubject<T>) {
    this.state$ = state$;
  }

  protected updateState(updater: (prevState: T) => T) {
    const current = this.state$.getValue();
    const updated = updater(current);
    this.state$.next(updated);
  }
}
