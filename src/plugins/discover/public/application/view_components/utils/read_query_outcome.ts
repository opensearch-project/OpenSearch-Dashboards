/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractQueryError } from '../../../../../data/common';
import { ResultStatus, SearchData } from './use_search';

export interface QueryOutcome {
  status: ResultStatus;
  resultsCount?: number;
  error?: string;
}

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

/**
 * Normalises a search result into "what happened to the query".
 */
export function readQueryOutcome(searchData: SearchData): QueryOutcome {
  // Only a settled search has a meaningful count: use_search spreads the previous
  // value when it merely flips the status, so the last fetch's rows outlive it.
  const isSettled =
    searchData.status === ResultStatus.READY || searchData.status === ResultStatus.NO_RESULTS;
  // A DQL/Lucene failure arrives as NO_RESULTS carrying the reason, so an empty
  // result holding actualError really is an error.
  const isErrorAsNoResults =
    searchData.status === ResultStatus.NO_RESULTS && !!searchData.actualError;
  const resultsCount = isSettled && !isErrorAsNoResults ? readResultsCount(searchData) : undefined;
  return {
    status: isErrorAsNoResults ? ResultStatus.ERROR : searchData.status,
    ...(typeof resultsCount === 'number' ? { resultsCount } : {}),
    ...(isErrorAsNoResults
      ? { error: searchData.actualError }
      : searchData.status === ResultStatus.ERROR
        ? { error: extractQueryError(searchData.queryStatus?.body?.error) }
        : {}),
  };
}
