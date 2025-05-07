/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';

export abstract class BaseActions<T> {
  protected setState(state$: BehaviorSubject<T>, updater: (prevState: T) => T) {
    const current = state$.getValue();
    const updated = updater(current);
    state$.next(updated);
  }
}
