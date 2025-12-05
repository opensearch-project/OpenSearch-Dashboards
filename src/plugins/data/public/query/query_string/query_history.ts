/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import uuid from 'uuid';
import { BehaviorSubject } from 'rxjs';
import { DataStorage } from '../../../common';
import { Query, TimeRange } from '../..';

const MAX_HISTORY_SIZE = 500;
export const HISTORY_KEY_PREFIX = 'query_';

export class QueryHistory {
  private changeEmitter: BehaviorSubject<any[]>;

  constructor(private readonly storage: DataStorage) {
    this.changeEmitter = new BehaviorSubject<any[]>(this.getHistory());
  }

  public getHistoryKeys(): string[] {
    return this.storage
      .keys()
      .filter((key: string) => key.startsWith(HISTORY_KEY_PREFIX))
      .sort((a, b) => {
        const timeA = parseInt(a.split('_')[1], 10);
        const timeB = parseInt(b.split('_')[1], 10);
        return timeB - timeA; // Sort in descending order (most recent first)
      });
  }

  public getHistory(): any[] {
    return this.getHistoryKeys()
      .map((key) => this.storage.get(key))
      .sort((a, b) => b.time - a.time);
  }

  public change(listener: (reqs: any[]) => void): () => void {
    const subscription = this.changeEmitter.subscribe(listener);
    return () => subscription.unsubscribe();
  }

  public addQueryToHistory(query: Query, dateRange?: TimeRange): void {
    const existingKeys = this.getHistoryKeys();

    // Check if the query already exists
    const existingKey = existingKeys.find((key) => {
      const item = this.storage.get(key);
      return item && item.query.query === query.query && item.query.language === query.language;
    });

    if (existingKey) {
      // If the query exists, remove it from its current position
      this.storage.remove(existingKey);
      existingKeys.splice(existingKeys.indexOf(existingKey), 1);
    }

    // Add the new query to the front
    const timestamp = Date.now();
    const newKey = `${HISTORY_KEY_PREFIX}${timestamp}`;
    const newItem = {
      time: timestamp,
      query,
      dateRange,
      id: uuid.v4(),
    };
    this.storage.set(newKey, newItem);

    // Trim the history if it exceeds the maximum size
    if (existingKeys.length >= MAX_HISTORY_SIZE) {
      const keysToRemove = existingKeys.slice(MAX_HISTORY_SIZE - 1);
      keysToRemove.forEach((key) => this.storage.remove(key));
    }

    // Emit the updated history
    this.changeEmitter.next(this.getHistory());
  }

  public clearHistory(): void {
    this.getHistoryKeys().forEach((key) => this.storage.remove(key));
    this.changeEmitter.next([]);
  }
}

export function createHistory(deps: { storage: DataStorage }): QueryHistory {
  return new QueryHistory(deps.storage);
}
