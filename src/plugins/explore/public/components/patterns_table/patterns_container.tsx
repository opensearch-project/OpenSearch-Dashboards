/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { PatternItem, PatternsTable } from './patterns_table';
import { COUNT_FIELD, PATTERNS_FIELD, SAMPLE_FIELD } from './utils/constants';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { RootState } from '../../application/utils/state_management/store';
import { defaultPrepareQuery } from '../../application/utils/state_management/actions/query_actions';

export const PatternsContainer = () => {
  const { results: patternResults } = useTabResults();

  const querySelector = useSelector((state: RootState) => state.query);
  const resultsSelector = useSelector((state: RootState) => state.results);

  const queryInput = typeof querySelector.query === 'string' ? querySelector.query : '';
  // the default prepare query is the one for logs, so it uses the user's query and generates the log cache key
  const logsCacheKey = defaultPrepareQuery(queryInput);

  const logsResults = resultsSelector[logsCacheKey] ?? null;
  const logsTotal = logsResults?.hits?.total;

  const hits = patternResults?.hits?.hits || [];
  // Convert rows to pattern items or use default if rows is undefined
  const items: PatternItem[] = hits?.map((row: any) => ({
    pattern: row._source[PATTERNS_FIELD],
    ratio: row._source[COUNT_FIELD] / logsTotal,
    count: row._source[COUNT_FIELD],
    sample: row._source[SAMPLE_FIELD],
  }));

  return <PatternsTable items={items} />;
};
