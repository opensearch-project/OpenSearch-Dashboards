/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { PromQLStepResolution } from '../../../../../../query_enhancements/common';
import { RootState } from '../../../utils/state_management/store';
import { resultsCache } from '../../../utils/state_management/slices';

export interface ExecutedStepResolution {
  /** Query string these steps were resolved for; row labels only line up with it. */
  query: string;
  maxDataPoints: number;
  byLabel: Record<string, { stepSec: number; rateIntervalSec: number }>;
}

/**
 * Steps the server resolved for the last executed query, reported back in the
 * response so the editor can show what ran rather than a second estimate of it.
 */
export function useExecutedStepResolution(): ExecutedStepResolution | undefined {
  const language = useSelector((state: RootState) => state.query.language);
  const queryText = useSelector((state: RootState) =>
    typeof state.query.query === 'string' ? state.query.query : ''
  );
  // Identity changes on every execution, so a re-run with a new step invalidates.
  const resultMetadata = useSelector((state: RootState) => state.results[queryText]);

  return useMemo(() => {
    if (language !== 'PROMQL' || !resultMetadata) return undefined;
    const stepResolution = resultsCache.get(queryText)?.frameMeta?.stepResolution as
      PromQLStepResolution | undefined;
    if (!stepResolution) return undefined;

    const byLabel: ExecutedStepResolution['byLabel'] = {};
    stepResolution.queries.forEach(({ label, stepSec, rateIntervalSec }) => {
      byLabel[label] = { stepSec, rateIntervalSec };
    });
    return { query: queryText, maxDataPoints: stepResolution.maxDataPoints, byLabel };
  }, [language, queryText, resultMetadata]);
}
