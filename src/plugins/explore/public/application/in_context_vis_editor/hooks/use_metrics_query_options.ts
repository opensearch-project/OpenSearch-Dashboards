/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveStep, ResolvedStep } from '../../../../../query_enhancements/common/metrics';
import type { PromQLStepResolution } from '../../../../../query_enhancements/common';
import { ExploreServices } from '../../../types';
import { useQueryBuilderState } from './use_query_builder_state';
import { SupportLanguageType } from '../query_builder/query_builder';

export interface MetricsQuerySettings {
  maxDataPoints?: number;
  onMaxDataPointsChange: (next?: number) => void;
  getResolvedStep: (minStep?: string) => ResolvedStep | null;
}

export function useMetricsQuerySettings(services: ExploreServices): MetricsQuerySettings {
  const { queryState, queryBuilder } = useQueryBuilderState();

  const maxDataPoints = queryState.queryOptions?.maxDataPoints;

  const [timeTick, setTimeTick] = useState(0);
  useEffect(() => {
    const { timefilter } = services.data.query.timefilter;
    const sub = timefilter.getTimeUpdate$().subscribe(() => setTimeTick((t) => t + 1));
    return () => sub.unsubscribe();
  }, [services.data.query.timefilter]);

  const getResolvedStep = useCallback(
    (minStep?: string): ResolvedStep | null => {
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
      queryBuilder.updateQueryOptions({ maxDataPoints: next });
      queryBuilder.updateQueryEditorState({ isQueryEditorDirty: true });
    },
    [queryBuilder]
  );

  return { maxDataPoints, onMaxDataPointsChange, getResolvedStep };
}

export interface ExecutedStepResolution {
  query: string;
  maxDataPoints: number;
  byLabel: Record<string, { stepSec: number; rateIntervalSec: number; minStep?: string }>;
}

export function useExecutedStepResolution(): ExecutedStepResolution | undefined {
  const { queryState, resultState } = useQueryBuilderState();

  return useMemo(() => {
    if (queryState.language !== SupportLanguageType.promQL || !resultState) return undefined;

    const stepResolution = resultState.frameMeta?.stepResolution as
      PromQLStepResolution | undefined;
    if (!stepResolution) return undefined;

    const byLabel: ExecutedStepResolution['byLabel'] = {};
    stepResolution.queries.forEach(({ label, stepSec, rateIntervalSec, minStep }) => {
      byLabel[label] = { stepSec, rateIntervalSec, minStep };
    });

    return { query: queryState.query, maxDataPoints: stepResolution.maxDataPoints, byLabel };
  }, [queryState, resultState]);
}
