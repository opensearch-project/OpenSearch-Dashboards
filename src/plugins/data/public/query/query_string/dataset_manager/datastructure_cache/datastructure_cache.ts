/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CachedDataStructure, DataStructure } from '../../../../../common';

export class DataStructureCache {
  private cache: Record<string, CachedDataStructure> = {};
  private maxCacheSize: number;
  private cacheTimeToLive: number;

  constructor(maxCacheSize: number = 100, cacheTimeToLive: number = 72000) {
    this.maxCacheSize = maxCacheSize;
    this.cacheTimeToLive = cacheTimeToLive;
  }

  private getOldestKey = () => {
    let oldestKey: string | undefined;
    let oldestTimestamp = Infinity;

    for (const [key, value] of Object.entries(this.cache)) {
      if (value.lastUpdated < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = value.lastUpdated;
      }
    }

    return oldestKey;
  };

  public set = (dataStructure: DataStructure) => {
    if (Object.keys(this.cache).length >= this.maxCacheSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        delete this.cache[oldestKey];
      }
    }
    this.cache[dataStructure.id] = {
      ...dataStructure,
      lastUpdated: Date.now(),
      fetchedChildren: false,
      parent: dataStructure?.parent?.id ?? '',
      children: [],
    } as CachedDataStructure;
  };

  public get = (id: string) => {
    const cachedDataStructure = this.cache[id];
    return cachedDataStructure ?? undefined;
  };
}
