/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PatternItem, PatternsTable } from './patterns_table';
import { COUNT_FIELD, PATTERNS_FIELD } from './utils/constants';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';

export const PatternsContainer = () => {
  const { results } = useTabResults();

  // TODO: Register custom processor for patterns tab if needed
  //       If no need, feel free to remove this comment
  // const tabDefinition = services.tabRegistry?.getTab?.('patterns');
  // const processor = tabDefinition?.resultsProcessor || defaultResultsProcessor;
  // const processedResults = processor(rawResults, indexPattern);

  const rows = results?.hits?.hits || [];

  // Convert rows to pattern items or use default if rows is undefined
  const items: PatternItem[] = rows?.map((row) => ({
    pattern: row._source[PATTERNS_FIELD],
    ratio: row._source[COUNT_FIELD] / 2096, // TODO: pull from total hits
    count: row._source[COUNT_FIELD],
  }));

  return <PatternsTable items={items} />;
};
