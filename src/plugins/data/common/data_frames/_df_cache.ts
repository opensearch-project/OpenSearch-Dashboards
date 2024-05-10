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
