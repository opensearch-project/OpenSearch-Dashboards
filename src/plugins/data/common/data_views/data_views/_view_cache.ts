/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataView } from './data_view';

export interface PatternCache {
  get: (id: string) => DataView;
  getByTitle: (title: string) => DataView;
  set: (id: string, value: DataView) => DataView;
  clear: (id: string) => void;
  clearAll: () => void;
}

export function createDataViewCache(): PatternCache {
  const vals: Record<string, any> = {};
  const cache: PatternCache = {
    get: (id: string) => {
      return vals[id];
    },
    getByTitle: (title: string) => {
      return Object.values(vals).find((pattern: DataView) => pattern.title === title);
    },
    set: (id: string, prom: any) => {
      vals[id] = prom;
      return prom;
    },
    clear: (id: string) => {
      delete vals[id];
    },
    clearAll: () => {
      for (const id in vals) {
        if (vals.hasOwnProperty(id)) {
          delete vals[id];
        }
      }
    },
  };
  return cache;
}
