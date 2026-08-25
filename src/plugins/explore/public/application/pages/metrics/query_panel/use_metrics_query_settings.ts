/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { resolveStep, ResolvedStep } from '../../../../../../query_enhancements/common/prom_step';
import { Query } from '../../../../../../data/common';
import { ExploreServices } from '../../../../types';
import { PromQLQueryOptions } from '../../../utils/languages';
import { setIsQueryEditorDirty } from '../../../../application/utils/state_management/slices/query_editor/query_editor_slice';
import { setMetricsQuerySettings } from '../../../../application/utils/state_management/slices/query/query_slice';
import { useDatasourceDefaultMinStep } from './use_datasource_default_min_step';

type MetricsQuery = Query & PromQLQueryOptions;

export interface MetricsQuerySettings {
  maxDataPoints?: number;
  onMaxDataPointsChange: (next?: number) => void;
  defaultMinStep?: string;
  onDefaultMinStepChange: (next?: string) => void;
  getResolvedStep: (minStep?: string) => ResolvedStep | null;
}

export function useMetricsQuerySettings(
  services: ExploreServices,
  connectionId: string
): MetricsQuerySettings {
  const dispatch = useDispatch();
  const { queryString } = services.data.query;

  const [maxDataPoints, setMaxDataPoints] = useState<number | undefined>(
    () => (queryString.getQuery() as MetricsQuery).maxDataPoints
  );

  const { defaultMinStep, onDefaultMinStepChange: persistDefaultMinStep } =
    useDatasourceDefaultMinStep(services, connectionId);

  // The datasource default is loaded asynchronously and edited outside the query
  // state, so mirror it onto the query the interceptor forwards to the server.
  useEffect(() => {
    const currentQuery = queryString.getQuery() as MetricsQuery;
    if (currentQuery.defaultMinStep === defaultMinStep) return;
    queryString.setQuery({ ...currentQuery, defaultMinStep } as MetricsQuery);
    dispatch(setMetricsQuerySettings({ defaultMinStep }));
  }, [defaultMinStep, queryString, dispatch]);

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
      return resolveStep({
        rangeMs: max - min,
        resolution: maxDataPoints,
        minStep: minStep ?? defaultMinStep,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxDataPoints, defaultMinStep, timeTick, services.data.query.timefilter]
  );

  const onMaxDataPointsChange = useCallback(
    (next?: number) => {
      setMaxDataPoints(next);
      const currentQuery = queryString.getQuery();
      queryString.setQuery({ ...currentQuery, maxDataPoints: next } as MetricsQuery);
      dispatch(setMetricsQuerySettings({ maxDataPoints: next }));
      dispatch(setIsQueryEditorDirty(true));
    },
    [queryString, dispatch]
  );

  const onDefaultMinStepChange = useCallback(
    (next?: string) => {
      persistDefaultMinStep(next);
      dispatch(setIsQueryEditorDirty(true));
    },
    [persistDefaultMinStep, dispatch]
  );

  return {
    maxDataPoints,
    onMaxDataPointsChange,
    defaultMinStep,
    onDefaultMinStepChange,
    getResolvedStep,
  };
}
