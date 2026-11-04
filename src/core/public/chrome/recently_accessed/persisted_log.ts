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

import { cloneDeep, isEqual, take } from 'lodash';
import * as Rx from 'rxjs';
import { map } from 'rxjs/operators';
import { isQuotaExceededError } from '@osd/std';

interface PersistedLogOptions<T = any> {
  maxLength: number | string;
  isEqual?: (oldItem: T, newItem: T) => boolean;
  /**
   * Called when the entry cannot be persisted because the browser's
   * localStorage quota is exhausted (even after shedding to an empty list).
   * PersistedLog is a browser-side core primitive with no access to the server
   * Logger facade or the notifications service, so it defaults to console.warn
   * (the established convention for core/public chrome code). Callers that have
   * a logger or want a user-facing toast can inject their own handler. `name`
   * is the storage key that failed to persist.
   */
  onQuotaExceeded?: (name: string) => void;
}

const defaultOnQuotaExceeded = (name: string) => {
  // eslint-disable-next-line no-console
  console.warn(
    `[PersistedLog] Unable to persist "${name}" to localStorage: the browser ` +
      `storage quota for this site is full. Clear site storage to restore history ` +
      `persistence. History will not be saved this session.`
  );
};

export class PersistedLog<T = any> {
  private name: string;
  private maxLength: number;
  private isEqual: (oldItem: T, newItem: T) => boolean;
  private storage: Storage;
  private onQuotaExceeded: (name: string) => void;
  // Guards against re-notifying on every add() while the quota stays full.
  // Reset after any successful write so a later re-exhaustion is reported afresh.
  private hasWarnedQuota = false;

  private items$: Rx.BehaviorSubject<T[]>;

  constructor(name: string, options: PersistedLogOptions<T>, storage = localStorage) {
    this.name = name;
    this.maxLength =
      typeof options.maxLength === 'string'
        ? (this.maxLength = parseInt(options.maxLength, 10))
        : options.maxLength;
    this.isEqual = options.isEqual || isEqual;
    this.onQuotaExceeded = options.onQuotaExceeded || defaultOnQuotaExceeded;
    this.storage = storage;
    this.items$ = new Rx.BehaviorSubject<T[]>(this.loadItems());

    if (this.maxLength !== undefined && !isNaN(this.maxLength)) {
      this.items$.next(take(this.items$.value, this.maxLength));
    }
  }

  public add(val: T) {
    if (val == null) {
      return this.items$.value;
    }

    const nextItems = [
      val,
      // remove any duplicate items
      ...[...this.items$.value].filter((item) => !this.isEqual(item, val)),
    ].slice(0, this.maxLength); // truncate

    // Persist the stack to storage. This may throw a QuotaExceededError when the
    // browser origin's localStorage is full, so persistItems() handles that
    // gracefully instead of letting it propagate to callers (and the UI).
    const persistedItems = this.persistItems(nextItems);
    // Notify subscribers with whatever we were actually able to persist, falling
    // back to the in-memory list if nothing could be written, so the runtime
    // list stays consistent for the current session.
    this.items$.next(persistedItems);

    return persistedItems;
  }

  public get() {
    return cloneDeep(this.items$.value);
  }

  public get$() {
    return this.items$.pipe(map((items) => cloneDeep(items)));
  }

  private loadItems() {
    try {
      return JSON.parse(this.storage.getItem(this.name) || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Persist the given items to storage, tolerating a full localStorage quota.
   *
   * The per-origin quota (~5 MB) is usually exhausted by *other* keys, since
   * this log is itself bounded by maxLength. Rather than let setItem's
   * QuotaExceededError surface to the user as a raw DOMException, shed the
   * oldest entries and retry; if even an empty write fails, keep the in-memory
   * list and notify via onQuotaExceeded instead of throwing. Non-quota errors
   * still propagate so unrelated failures are not masked.
   *
   * @returns the items actually persisted (possibly a shed-down subset, or the
   *          original in-memory list if nothing could be written).
   */
  private persistItems(items: T[]): T[] {
    let candidate = items;
    // One attempt per item plus one final empty-list attempt. The length === 0
    // branch is the functional stop; this cap is a guard against a future
    // refactor spinning forever.
    const maxAttempts = items.length + 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        this.storage.setItem(this.name, JSON.stringify(candidate));
        // Clear the warn guard so a future re-exhaustion warns afresh.
        this.hasWarnedQuota = false;
        return candidate;
      } catch (e) {
        if (!isQuotaExceededError(e)) {
          throw e;
        }
        if (candidate.length === 0) {
          // Even an empty list won't fit: other origin keys hold the quota.
          // Keep the in-memory list and notify at most once while it stays full.
          if (!this.hasWarnedQuota) {
            this.hasWarnedQuota = true;
            this.onQuotaExceeded(this.name);
          }
          return items;
        }
        candidate = candidate.slice(0, candidate.length - 1);
      }
    }
    return items;
  }
}
