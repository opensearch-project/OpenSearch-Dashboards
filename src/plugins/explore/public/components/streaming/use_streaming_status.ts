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
 * Defaults to the results query, which is what page-level controls track regardless of the active tab.
 * Pass `cacheKeyOverride` to follow a specific query instead: only the results query is streamed, so a
 * consumer displaying another query's numbers must not annotate them with this one's progress.
 *
 * `defaultPrepareQueryString` throws for languages it does not handle, and this runs on every render of
 * the page including before the query slice is populated, so it is guarded.
 */
export const useStreamingStatus = (cacheKeyOverride?: string): StreamingStatus => {
  const query = useSelector((state: RootState) => state.query);

  const cacheKey = useMemo(() => {
    if (cacheKeyOverride !== undefined) return cacheKeyOverride;
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
