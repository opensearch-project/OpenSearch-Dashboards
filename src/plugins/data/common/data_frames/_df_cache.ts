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
