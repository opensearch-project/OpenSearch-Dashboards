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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { BehaviorSubject } from 'rxjs';
import { isQuotaExceededError } from '@osd/std';
import { Storage, storedByteLength } from './index';

/**
 * Largest request body persisted per entry, in characters (~50KB of the ASCII
 * JSON request bodies are). Bodies past this are pasted from a file the user
 * still has, so persisting them verbatim only exhausts the origin's quota.
 */
export const MAX_ENTRY_DATA_CHARS = 50 * 1024;

/**
 * Total stored bytes all history entries may occupy. localStorage is one ~5MB
 * store shared by the whole origin, so Console must not consume it all. A
 * per-entry cap alone bounds nothing: enough mid-sized entries still exhaust it.
 */
export const MAX_HISTORY_STORED_BYTES = 1024 * 1024;

/** Most recent entries retained, regardless of size. */
export const MAX_HISTORY_ENTRIES = 500;

export class History {
  constructor(private readonly storage: Storage) {}

  private changeEmitter = new BehaviorSubject<any[]>(this.getHistory() || []);

  getHistoryKeys() {
    return this.storage
      .keys()
      .filter((key: string) => key.indexOf('hist_elem') === 0)
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

  /**
   * Drops an oversized body but keeps the entry, so the user still sees the
   * request ran. restoreRequestFromHistory already guards on absent req.data.
   */
  private buildEntry(timestamp: number, endpoint: string, method: string, data: any) {
    const base = { time: timestamp, endpoint, method };
    if (data === undefined || data === null || data === '') {
      return base;
    }

    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    if (serialized.length > MAX_ENTRY_DATA_CHARS) {
      // Drives the "body not saved" label in the history list.
      return { ...base, dataOmitted: true };
    }

    return { ...base, data };
  }

  /** Evicts oldest entries until the retained set plus `incomingBytes` fits. */
  private evictToBudget(incomingBytes: number) {
    const keys = this.getHistoryKeys(); // newest first
    keys.splice(MAX_HISTORY_ENTRIES).forEach((key) => this.storage.delete(key));

    let total = incomingBytes + keys.reduce((sum, key) => sum + this.storage.rawByteLength(key), 0);

    while (keys.length > 0 && total > MAX_HISTORY_STORED_BYTES) {
      const oldest = keys.pop() as string;
      total -= this.storage.rawByteLength(oldest);
      this.storage.delete(oldest);
    }
  }

  addToHistory(endpoint: string, method: string, data: any) {
    const timestamp = new Date().getTime();
    const key = 'hist_elem_' + timestamp;
    const entry = this.buildEntry(timestamp, endpoint, method, data);
    const incomingBytes = storedByteLength(this.storage.encodeKey(key), this.storage.encode(entry));

    this.evictToBudget(incomingBytes);

    // Our own budget does not guarantee the write fits: the quota is shared with
    // every other key on the origin. Shed oldest and retry so a store filled
    // elsewhere degrades history rather than failing the write. Shedding from a
    // snapshot (not a re-query) terminates even if a delete does not take hold.
    let sheddable: string[] | undefined;
    for (;;) {
      try {
        this.storage.set(key, entry);
        break;
      } catch (e) {
        if (!isQuotaExceededError(e)) throw e;
        if (!sheddable) {
          sheddable = this.getHistoryKeys().filter((k) => k !== key);
        }
        if (sheddable.length === 0) {
          // Nothing left to give back; the caller notifies the user.
          throw e;
        }
        this.storage.delete(sheddable.pop() as string);
      }
    }

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
    this.storage.delete('editor_state');
  }

  clearHistory() {
    this.getHistoryKeys().forEach((key) => this.storage.delete(key));
  }
}

export function createHistory(deps: { storage: Storage }) {
  return new History(deps.storage);
}
