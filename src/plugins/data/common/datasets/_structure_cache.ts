/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataStructure, CachedDataStructure } from './types';

export interface DataStructureCache {
  get: (id: string) => CachedDataStructure | undefined;
  set: (id: string, value: CachedDataStructure) => CachedDataStructure;
  clear: (id: string) => void;
  clearAll: () => void;
}

export function createDataStructureCache(): DataStructureCache {
  const cache: Record<string, CachedDataStructure> = {};

  const dataStructureCache: DataStructureCache = {
    get: (id: string) => {
      return cache[id];
    },
    set: (id: string, value: CachedDataStructure) => {
      cache[id] = value;
      return value;
    },
    clear: (id: string) => {
      delete cache[id];
    },
    // TODO: call this on log out
    clearAll: () => {
      Object.keys(cache).forEach((key) => delete cache[key]);
    },
  };

  return dataStructureCache;
}

export function toCachedDataStructure(dataStructure: DataStructure): CachedDataStructure {
  return {
    id: dataStructure.id,
    title: dataStructure.title,
    type: dataStructure.type,
    parent: dataStructure.parent?.id || '',
    children: dataStructure.children?.map((child) => child.id) || [],
  };
}
