/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PatternItem, PatternsTable } from './patterns_table';
import { COUNT_FIELD, PATTERNS_FIELD } from './utils/constants';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { useSelector } from 'react-redux';
import { RootState } from '../../application/utils/state_management/store';

export const PatternsContainer = () => {
  const { results } = useTabResults();

  // TODO: Register custom processor for patterns tab if needed
  //       If no need, feel free to remove this comment
  // const tabDefinition = services.tabRegistry?.getTab?.('patterns');
  // const processor = tabDefinition?.resultsProcessor || defaultResultsProcessor;
  // const processedResults = processor(rawResults, indexPattern);

  const rows = results?.hits?.hits || [];

  const { hits, totalCount } = useSelector((state: RootState) => {
    const executionCacheKeys = state.ui?.executionCacheKeys || [];
    if (executionCacheKeys.length === 0) {
      return { hits: [], totalCount: 0 };
    }

    const patternsCacheKey = executionCacheKeys[1]; // TODO: replace magic 1 with pat tab pos
    const patternsResults = state.results[patternsCacheKey];

    const logsCacheKey = executionCacheKeys[0]; // TODO: replace magic 0 with logs tab pos
    const logsResults = state.results[logsCacheKey];

    if (patternsResults && patternsResults.hits && logsResults && logsResults.hits) {
      return {
        hits: patternsResults.hits.hits,
        totalCount: logsResults.hits.total,
      };
    }

    return { hits: [], totalCount: 0 };
  });

  // Convert rows to pattern items or use default if rows is undefined
  const items: PatternItem[] = hits?.map((row: any) => ({
    pattern: row._source[PATTERNS_FIELD],
    ratio: row._source[COUNT_FIELD] / totalCount,
    count: row._source[COUNT_FIELD],
  }));

  return <PatternsTable items={items} />;
};
