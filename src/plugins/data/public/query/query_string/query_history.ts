/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { DataStorage, Dataset } from '../../../common';
import { Query, TimeRange } from '../..';

// Todo: Implement a more advanced QueryHistory class when needed for recent query history
export class QueryHistory {
  constructor(private readonly storage: DataStorage) {}

  private changeEmitter = new BehaviorSubject<any[]>(this.getHistory() || []);

  getHistoryKeys() {
    return this.storage
      .keys()
      .filter((key: string) => key.indexOf('query_') === 0)
      .sort()
      .reverse();
  }

  getHistory() {
    return this.getHistoryKeys().map((key) => this.storage.get(key));
  }

  // This is used as an optimization mechanism so that different components
  // can listen for changes to history and update because changes to history can
  // be triggered from different places in the app. The alternative would be to store
  // this in state so that we hook into the React model, but it would require loading history
  // every time the application starts even if a user is not going to view history.
  change(listener: (reqs: any[]) => void) {
    const subscription = this.changeEmitter.subscribe(listener);
    return () => subscription.unsubscribe();
  }

  addQueryToHistory(query: Query, dateRange?: TimeRange) {
    const keys = this.getHistoryKeys();
    keys.splice(0, 500); // only maintain most recent X;
    keys.forEach((key) => {
      this.storage.remove(key);
    });

    const timestamp = new Date().getTime();
    const k = 'query_' + timestamp;
    this.storage.set(k, {
      time: timestamp,
      query,
      dateRange,
    });

    this.changeEmitter.next(this.getHistory());
  }

  clearHistory() {
    this.getHistoryKeys().forEach((key) => this.storage.remove(key));
  }
}

export function createHistory(deps: { storage: DataStorage }) {
  return new QueryHistory(deps.storage);
}
