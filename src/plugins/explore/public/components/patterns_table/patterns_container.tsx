/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { PatternItem, PatternsTable } from './patterns_table';
import { COUNT_FIELD, PATTERNS_FIELD, SAMPLE_FIELD } from './utils/constants';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { defaultPrepareQueryString } from '../../application/utils/state_management/actions/query_actions';
import { highlightLogUsingPattern } from './utils/utils';
import { PatternsSettingsPopoverContent } from '../tabs/action_bar/patterns_settings/patterns_settings_popover_content';
import {
  selectQuery,
  selectResults,
  selectUsingRegexPatterns,
} from '../../application/utils/state_management/selectors';
import { PatternsTableFlyout } from './patterns_table_flyout/patterns_table_flyout';
import {
  PatternsFlyoutProvider,
  usePatternsFlyoutContext,
} from './patterns_table_flyout/patterns_flyout_context';

const PatternsContainerContent = () => {
  const { isFlyoutOpen } = usePatternsFlyoutContext();

  /**
   * Fetching the hits from the patterns query, and processing them for the table
   */
  const { results: patternResults } = useTabResults();

  const querySelector = useSelector(selectQuery);
  const resultsSelector = useSelector(selectResults);
  const usingRegexPatterns = useSelector(selectUsingRegexPatterns);

  try {
    // the default prepare query is the one for logs, so it uses the user's query and generates the log cache key
    const logsCacheKey = defaultPrepareQueryString(querySelector);

    const logsResults = resultsSelector[logsCacheKey];
    const logsTotal = logsResults?.hits?.total; // uses the logs total to calc the event ratio

    const hits = patternResults?.hits?.hits || [];

    const hit = hits?.[0];
    if (!hit) {
      return <PatternsSettingsPopoverContent />;
    }

    // Check if the hit has all required fields in hit._source
    const requiredFields = [COUNT_FIELD, SAMPLE_FIELD, PATTERNS_FIELD];
    const hasAllRequiredFields = requiredFields.every((field) => field in hit._source);

    if (!hasAllRequiredFields) {
      return <></>;
    }

    // Convert rows to pattern items or use default if rows is undefined
    const items: PatternItem[] = hits?.map((row: any) => ({
      // not including null check for logs total, the table will handle errors and we want to
      //    display the other information if it can appear fine
      ratio: row._source[COUNT_FIELD] / logsTotal,
      count: row._source[COUNT_FIELD],
      // SAMPLE_FIELD needs [0] because the sample will be an array, but we're showing a 'sample' so 0th is fine
      sample: usingRegexPatterns
        ? row._source[SAMPLE_FIELD][0]
        : highlightLogUsingPattern(row._source[SAMPLE_FIELD][0], row._source[PATTERNS_FIELD]),
      flyout: {
        pattern: row._source[PATTERNS_FIELD],
        count: row._source[COUNT_FIELD],
        sample: row._source[SAMPLE_FIELD],
      },
    }));

    return (
      <>
        {isFlyoutOpen && <PatternsTableFlyout />}
        <PatternsTable items={items} />
      </>
    );
  } catch {
    return <></>;
  }
};

export const PatternsContainer = () => {
  return (
    <PatternsFlyoutProvider>
      <PatternsContainerContent />
    </PatternsFlyoutProvider>
  );
};
