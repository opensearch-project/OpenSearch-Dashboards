/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { BehaviorSubject } from 'rxjs';
import { QueryStorage } from './storage';
import { Query, TimeRange } from '../..';

export class History {
  constructor(private readonly storage: QueryStorage) {}

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

  addQueryToHistory(dataSet: string, query: Query, dateRange?: TimeRange) {
    const keys = this.getHistoryKeys();
    keys.splice(0, 500); // only maintain most recent X;
    keys.forEach((key) => {
      this.storage.remove(key);
    });

    const timestamp = new Date().getTime();
    const k = 'query_' + timestamp;
    this.storage.set(k, {
      dataSet,
      time: timestamp,
      query,
      dateRange,
    });

    this.changeEmitter.next(this.getHistory());
  }

  updateCurrentState(content: any) {
    const timestamp = new Date().getTime();
    this.storage.set('editor_state', {
      time: timestamp,
      content,
    });
  }

  getLegacySavedEditorState() {
    const saved = this.storage.get('editor_state');
    if (!saved) return;
    const { time, content } = saved;
    return { time, content };
  }

  /**
   * This function should only ever be called once for a user if they had legacy state.
   */
  deleteLegacySavedEditorState() {
    this.storage.remove('editor_state');
  }

  clearHistory() {
    this.getHistoryKeys().forEach((key) => this.storage.remove(key));
  }
}

export function createHistory(deps: { storage: QueryStorage }) {
  return new History(deps.storage);
}
