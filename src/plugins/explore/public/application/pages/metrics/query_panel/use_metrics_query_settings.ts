/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  calculateStep,
  parseStepIntervalSeconds,
  DEFAULT_RESOLUTION,
  MIN_STEP_INTERVAL,
} from '../prom_step';
import { Query } from '../../../../../../data/common';
import { ExploreServices } from '../../../../types';
import { PromQLQueryOptions } from '../../../utils/languages';
import { setIsQueryEditorDirty } from '../../../../application/utils/state_management/slices/query_editor/query_editor_slice';
import { setMetricsQuerySettings } from '../../../../application/utils/state_management/slices/query/query_slice';

type MetricsQuery = Query & PromQLQueryOptions;

export interface MetricsQuerySettings {
  maxDataPoints?: number;
  onMaxDataPointsChange: (next?: number) => void;
  getResolvedStepSec: (minStep?: string) => number | null;
}

export function useMetricsQuerySettings(services: ExploreServices): MetricsQuerySettings {
  const dispatch = useDispatch();
  const { queryString } = services.data.query;

  const [maxDataPoints, setMaxDataPoints] = useState<number | undefined>(
    () => (queryString.getQuery() as MetricsQuery).maxDataPoints
  );

  const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    const { timefilter } = services.data.query.timefilter;
    const sub = timefilter.getTimeUpdate$().subscribe(() => setTimeTick((t) => t + 1));
    return () => sub.unsubscribe();
  }, [services.data.query.timefilter]);

  const getResolvedStepSec = useCallback(
    (minStep?: string) => {
      const { timefilter } = services.data.query.timefilter;
      const bounds = timefilter.getBounds();
      const min = bounds?.min?.valueOf();
      const max = bounds?.max?.valueOf();
      if (min === undefined || max === undefined || max <= min) return null;
      const parsed = minStep ? parseStepIntervalSeconds(minStep) : undefined;
      const minStepSec = parsed && parsed > 0 ? parsed : undefined;
      const resolution = maxDataPoints && maxDataPoints > 0 ? maxDataPoints : DEFAULT_RESOLUTION;
      return calculateStep(max - min, resolution, minStepSec ?? MIN_STEP_INTERVAL);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxDataPoints, timeTick, services.data.query.timefilter]
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

  return {
    maxDataPoints,
    onMaxDataPointsChange,
    getResolvedStepSec,
  };
}
