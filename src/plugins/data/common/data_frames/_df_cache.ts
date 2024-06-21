/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDataFrame } from '..';

export interface DfsCache {
  get: (name: string) => IDataFrame | undefined;
  set: (name: string, prom: IDataFrame) => void;
  clear: (name: string) => void;
  clearAll: () => void;
}

export function createDataFramesCache(): DfsCache {
  const dfs: Record<string, IDataFrame> = {};
  const cache: DfsCache = {
    get: (name: string) => {
      return dfs[name];
    },
    set: (name: string, df: IDataFrame) => {
      dfs[name] = df;
      return;
    },
    clear: (name: string) => {
      delete dfs[name];
    },
    clearAll: () => {
      Object.keys(dfs).forEach((name) => delete dfs[name]);
    },
  };
  return cache;
}
