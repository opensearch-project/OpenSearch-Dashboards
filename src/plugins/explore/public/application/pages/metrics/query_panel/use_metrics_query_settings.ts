/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { MetricsStepSettingsValue } from './metrics_query_options';

type MetricsQuery = Query & PromQLQueryOptions;

export interface MetricsQuerySettings {
  stepSettings: MetricsStepSettingsValue;
  legendFormat?: string;
  minStepInvalid: boolean;
  resolvedStepSec: number | null;
  onStepSettingsChange: (next: MetricsStepSettingsValue) => void;
  onLegendFormatChange: (next?: string) => void;
}

export function useMetricsQuerySettings(services: ExploreServices): MetricsQuerySettings {
  const dispatch = useDispatch();
  const { queryString } = services.data.query;

  const [stepSettings, setStepSettings] = useState<MetricsStepSettingsValue>(() => {
    const q = queryString.getQuery() as MetricsQuery;
    return { maxDataPoints: q.maxDataPoints, minStep: q.minStep };
  });

  const [legendFormat, setLegendFormat] = useState<string | undefined>(
    () => (queryString.getQuery() as MetricsQuery).legendFormat
  );

  const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    const { timefilter } = services.data.query.timefilter;
    const sub = timefilter.getTimeUpdate$().subscribe(() => setTimeTick((t) => t + 1));
    return () => sub.unsubscribe();
  }, [services.data.query.timefilter]);

  const minStepSec = useMemo(() => {
    if (!stepSettings.minStep) return undefined;
    const parsed = parseStepIntervalSeconds(stepSettings.minStep);
    return parsed && parsed > 0 ? parsed : undefined;
  }, [stepSettings.minStep]);

  const minStepInvalid = !!stepSettings.minStep && minStepSec === undefined;

  const resolvedStepSec = useMemo(() => {
    const { timefilter } = services.data.query.timefilter;
    const bounds = timefilter.getBounds();
    const min = bounds?.min?.valueOf();
    const max = bounds?.max?.valueOf();
    if (min === undefined || max === undefined || max <= min) return null;
    const resolution =
      stepSettings.maxDataPoints && stepSettings.maxDataPoints > 0
        ? stepSettings.maxDataPoints
        : DEFAULT_RESOLUTION;
    return calculateStep(max - min, resolution, minStepSec ?? MIN_STEP_INTERVAL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepSettings.maxDataPoints, minStepSec, timeTick, services.data.query.timefilter]);

  const onStepSettingsChange = useCallback(
    (next: MetricsStepSettingsValue) => {
      setStepSettings(next);
      const currentQuery = queryString.getQuery();
      queryString.setQuery({
        ...currentQuery,
        maxDataPoints: next.maxDataPoints,
        minStep: next.minStep,
      } as MetricsQuery);
      dispatch(
        setMetricsQuerySettings({
          maxDataPoints: next.maxDataPoints,
          minStep: next.minStep,
          legendFormat,
        })
      );
      dispatch(setIsQueryEditorDirty(true));
    },
    [queryString, dispatch, legendFormat]
  );

  const onLegendFormatChange = useCallback(
    (next?: string) => {
      setLegendFormat(next);
      const currentQuery = queryString.getQuery();
      queryString.setQuery({ ...currentQuery, legendFormat: next } as MetricsQuery);
      dispatch(
        setMetricsQuerySettings({
          maxDataPoints: stepSettings.maxDataPoints,
          minStep: stepSettings.minStep,
          legendFormat: next,
        })
      );
      dispatch(setIsQueryEditorDirty(true));
    },
    [queryString, dispatch, stepSettings.maxDataPoints, stepSettings.minStep]
  );

  return {
    stepSettings,
    legendFormat,
    minStepInvalid,
    resolvedStepSec,
    onStepSettingsChange,
    onLegendFormatChange,
  };
}
