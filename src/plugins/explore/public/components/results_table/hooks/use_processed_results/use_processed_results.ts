/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { useRawResults } from '../use_raw_results';
import { useDatasetContext } from '../../../../application/context';
import { defaultResultsProcessor } from '../../../../application/utils/state_management/actions/query_actions';

export const useProcessedResults = () => {
  const rawResults = useRawResults();
  const { dataset } = useDatasetContext();

  return useMemo(() => {
    if (!rawResults || !dataset) {
      return null;
    }

    return defaultResultsProcessor(rawResults, dataset);
  }, [rawResults, dataset]);
};
