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
import { defaultPrepareQueryString } from '../../application/utils/state_management/actions/query_actions';
import { highlightLogUsingPattern } from './utils/utils';
import { PatternsSettingsPopoverContent } from '../tabs/action_bar/patterns_settings/patterns_settings_popover_content';

export const PatternsContainer = () => {
  const { results: patternResults } = useTabResults();

  const querySelector = useSelector((state: RootState) => state.query);
  const resultsSelector = useSelector((state: RootState) => state.results);

  // the default prepare query is the one for logs, so it uses the user's query and generates the log cache key
  const logsCacheKey = defaultPrepareQueryString(querySelector);

  const logsResults = resultsSelector[logsCacheKey] ?? null;
  const logsTotal = logsResults?.hits?.total;

  const hits = patternResults?.hits?.hits || [];

  const hit = hits?.[0];
  if (!hit) {
    return <PatternsSettingsPopoverContent />;
  }
  // Check if each hit has the required fields in row._source
  const hasCountField = COUNT_FIELD in hit._source;
  const hasSampleField = SAMPLE_FIELD in hit._source;
  const hasPatternsField = PATTERNS_FIELD in hit._source;

  if (!(hasCountField && hasSampleField && hasPatternsField)) {
    return <></>;
  }

  // Convert rows to pattern items or use default if rows is undefined
  const items: PatternItem[] = hits?.map((row: any) => ({
    ratio: row._source[COUNT_FIELD] / logsTotal,
    count: row._source[COUNT_FIELD],
    sample: highlightLogUsingPattern(row._source[SAMPLE_FIELD][0], row._source[PATTERNS_FIELD]),
  }));

  return <PatternsTable items={items} />;
};
