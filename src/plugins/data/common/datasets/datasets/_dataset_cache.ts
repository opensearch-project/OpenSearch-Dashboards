/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dataset } from '..';

export interface DatasetCache {
  get: (id: string) => Dataset;
  getByTitle: (title: string) => Dataset;
  set: (id: string, value: Dataset) => Dataset;
  clear: (id: string) => void;
  clearAll: () => void;
}

export function createDatasetCache(): DatasetCache {
  const vals: Record<string, any> = {};
  const cache: DatasetCache = {
    get: (id: string) => {
      return vals[id];
    },
    getByTitle: (title: string) => {
      return Object.values(vals).find((dataset: Dataset) => dataset.title === title);
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
