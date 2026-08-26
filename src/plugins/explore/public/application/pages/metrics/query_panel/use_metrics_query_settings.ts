/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Query } from '../../../../../../data/common';
import { resolveStep, ResolvedStep } from '../../../../../../query_enhancements/common/metrics';
import { ExploreServices } from '../../../../types';
import type { PromQLQuery } from '../../../../../../query_enhancements/common';
import { setIsQueryEditorDirty } from '../../../../application/utils/state_management/slices/query_editor/query_editor_slice';
import { setQueryOptions } from '../../../../application/utils/state_management/slices/query/query_slice';

export interface MetricsQuerySettings {
  maxDataPoints?: number;
  onMaxDataPointsChange: (next?: number) => void;
  getResolvedStep: (minStep?: string) => ResolvedStep | null;
}

export function useMetricsQuerySettings(services: ExploreServices): MetricsQuerySettings {
  const dispatch = useDispatch();
  const { queryString } = services.data.query;

  const [maxDataPoints, setMaxDataPoints] = useState<number | undefined>(
    () => (queryString.getQuery() as PromQLQuery).queryOptions?.maxDataPoints
  );

  const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    const { timefilter } = services.data.query.timefilter;
    const sub = timefilter.getTimeUpdate$().subscribe(() => setTimeTick((t) => t + 1));
    return () => sub.unsubscribe();
  }, [services.data.query.timefilter]);

  const getResolvedStep = useCallback(
    (minStep?: string) => {
      const { timefilter } = services.data.query.timefilter;
      const bounds = timefilter.getBounds();
      const min = bounds?.min?.valueOf();
      const max = bounds?.max?.valueOf();
      if (min === undefined || max === undefined || max <= min) return null;
      return resolveStep({ rangeMs: max - min, resolution: maxDataPoints, minStep });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxDataPoints, timeTick, services.data.query.timefilter]
  );

  const onMaxDataPointsChange = useCallback(
    (next?: number) => {
      setMaxDataPoints(next);
      const currentQuery = queryString.getQuery() as PromQLQuery;
      queryString.setQuery({
        ...currentQuery,
        queryOptions: { ...currentQuery.queryOptions, maxDataPoints: next },
      } as Partial<Query>);
      dispatch(setQueryOptions({ maxDataPoints: next }));
      dispatch(setIsQueryEditorDirty(true));
    },
    [queryString, dispatch]
  );

  return { maxDataPoints, onMaxDataPointsChange, getResolvedStep };
}
