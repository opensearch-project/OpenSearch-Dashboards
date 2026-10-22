/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchData } from './use_search';

export function readResultsCount(searchData: SearchData): number | undefined {
  const hits = searchData.hits;
  const rowCount = searchData.rows?.length;

  if (hits === undefined) {
    return rowCount;
  }
  if (rowCount === undefined) {
    return hits;
  }
  return Math.max(hits, rowCount);
}
