/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDataFrame } from '..';

export interface DfCache {
  get: () => IDataFrame | undefined;
  set: (value: IDataFrame) => IDataFrame;
  clear: () => void;
}

export function createDataFrameCache(): DfCache {
  let df: IDataFrame | undefined;
  const cache: DfCache = {
    get: () => {
      return df;
    },
    set: (prom: IDataFrame) => {
      df = prom;
      return prom;
    },
    clear: () => {
      df = undefined;
    },
  };
  return cache;
}

export interface DfsCache {
  get: (name: string) => IDataFrame | undefined;
  set: (name: string, prom: IDataFrame) => IDataFrame;
  clear: (name: string) => void;
}

export function createDataFramesCache(): DfsCache {
  const dfs: Record<string, IDataFrame> = {};
  const cache: DfsCache = {
    get: (name: string) => {
      return dfs[name];
    },
    set: (name: string, prom: IDataFrame) => {
      dfs[name] = prom;
      return prom;
    },
    clear: (name: string) => {
      delete dfs[name];
    },
  };
  return cache;
}
