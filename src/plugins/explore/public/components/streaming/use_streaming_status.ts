/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../application/utils/state_management/store';
import { defaultPrepareQueryString } from '../../application/utils/state_management/actions/query_actions';
import { StreamingQueryStatus } from '../../application/utils/state_management/types';

export interface StreamingStatus {
  /** Undefined until the query slice is populated, so callers must tolerate its absence. */
  cacheKey?: string;
  streaming?: StreamingQueryStatus;
  isPolling: boolean;
}

/**
 * Streaming progress for a query, or an inert value when nothing is streaming.
 *
 * `cacheKeyOverride` selects what to follow:
 *   - omitted (undefined): the results query, which is what page-level controls track;
 *   - a key: that specific query, for a consumer showing its numbers;
 *   - null: nothing, for a consumer whose key could not be resolved and must not fall back to the
 *     results query and mis-annotate a different query with its progress.
 *
 * `defaultPrepareQueryString` throws for languages it does not handle, and this runs on every render of
 * the page including before the query slice is populated, so it is guarded.
 */
export const useStreamingStatus = (cacheKeyOverride?: string | null): StreamingStatus => {
  const query = useSelector((state: RootState) => state.query);

  const cacheKey = useMemo(() => {
    if (cacheKeyOverride !== undefined) return cacheKeyOverride ?? undefined;
    try {
      return query ? defaultPrepareQueryString(query) : undefined;
    } catch {
      return undefined;
    }
  }, [query, cacheKeyOverride]);

  const streaming = useSelector((state: RootState) =>
    cacheKey ? state.queryEditor?.queryStatusMap?.[cacheKey]?.streaming : undefined
  );

  return { cacheKey, streaming, isPolling: Boolean(streaming?.isPolling) };
};
