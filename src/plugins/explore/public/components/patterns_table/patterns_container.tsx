/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { EXPLORE_LOGS_TAB_ID } from '../../../common';
import { PatternItem, PatternsTable } from './patterns_table';
import { COUNT_FIELD, PATTERNS_FIELD, SAMPLE_FIELD } from './utils/constants';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import {
  createExcludeSearchPatternQuery,
  createSearchPatternQuery,
  highlightLogUsingPattern,
} from './utils/utils';
import {
  selectPatternsField,
  selectQuery,
  selectUsingRegexPatterns,
} from '../../application/utils/state_management/selectors';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { PatternsTableFlyout } from './patterns_table_flyout/patterns_table_flyout';
import {
  PatternsFlyoutProvider,
  usePatternsFlyoutContext,
} from './patterns_table_flyout/patterns_flyout_context';
import { useHistogramResults } from '../../application/utils/hooks/use_histogram_results';
import { QueryExecutionStatus } from '../../application/utils/state_management/types';
import {
  setActiveTab,
  setQueryStringWithHistory,
} from '../../application/utils/state_management/slices';
import { useSetEditorText } from '../../application/hooks';
import { executeQueries } from '../../application/utils/state_management/actions/query_actions';

interface PatternsContainerContentProps {
  onFilteredCountChange?: (count: number) => void;
}

const PatternsContainerContent = ({
  onFilteredCountChange,
}: PatternsContainerContentProps = {}) => {
  const { isFlyoutOpen } = usePatternsFlyoutContext();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const isDarkMode = services.uiSettings.get('theme:darkMode');

  const dispatch = useDispatch();
  const setEditorText = useSetEditorText();
  const originalQuery = useSelector(selectQuery);
  const selectedPatternsField = useSelector(selectPatternsField);

  /**
   * Fetching the hits from the patterns query, and processing them for the table
   */
  const { results: patternResults, status } = useTabResults();
  const { results: histogramResults } = useHistogramResults();

  const usingRegexPatterns = useSelector(selectUsingRegexPatterns);

  const redirectToLogsWithQuery = useCallback(
    (query: string) => {
      dispatch(setQueryStringWithHistory(query));
      setEditorText(query);
      dispatch(setActiveTab(EXPLORE_LOGS_TAB_ID));
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      dispatch(executeQueries({ services }));
    },
    [dispatch, setEditorText, services]
  );

  const filterForPattern = useCallback(
    (patternString: string) => {
      if (!selectedPatternsField) return;
      const newQuery = createSearchPatternQuery(
        originalQuery,
        selectedPatternsField,
        usingRegexPatterns,
        patternString
      );
      redirectToLogsWithQuery(newQuery);
    },
    [originalQuery, selectedPatternsField, usingRegexPatterns, redirectToLogsWithQuery]
  );

  const filterOutPattern = useCallback(
    (patternString: string) => {
      if (!selectedPatternsField) return;
      const newQuery = createExcludeSearchPatternQuery(
        originalQuery,
        selectedPatternsField,
        usingRegexPatterns,
        patternString
      );
      redirectToLogsWithQuery(newQuery);
    },
    [originalQuery, selectedPatternsField, usingRegexPatterns, redirectToLogsWithQuery]
  );

  const logsTotal = histogramResults?.hits.total || 0;

  // SQL patterns come back as unaliased columns ([pattern, COUNT(*), MIN(sample)] by
  // position) rather than the PPL field names, and the sample is a scalar rather than
  // PPL's take(field, 1) array. Normalize both shapes into { pattern, count, sample }.
  const isSqlPatterns = originalQuery?.language === 'SQL';
  const patternRows = useMemo(() => {
    const rawHits = patternResults?.hits?.hits || [];
    const schema = (patternResults as any)?.fieldSchema || [];

    return rawHits
      .map((row: any) => {
        const source = row?._source;
        if (!source) return null;

        let pattern;
        let count;
        let sample;

        if (isSqlPatterns) {
          const patternKey = schema[0]?.name ?? 'pattern';
          const countKey = schema[1]?.name ?? 'COUNT(*)';
          const sampleKey = schema[2]?.name ?? 'MIN(sample)';
          pattern = source[patternKey];
          count = source[countKey];
          sample = source[sampleKey];
        } else {
          pattern = source[PATTERNS_FIELD];
          count = source[COUNT_FIELD];
          // PPL sample is an array (take(field, 1))
          sample = Array.isArray(source[SAMPLE_FIELD]) ? source[SAMPLE_FIELD][0] : undefined;
        }

        if (pattern == null || count == null || sample == null) return null;
        return { pattern, count, sample };
      })
      .filter(Boolean) as Array<{ pattern: string; count: number; sample: string }>;
  }, [patternResults, isSqlPatterns]);

  const items: PatternItem[] = useMemo(
    () =>
      patternRows.map((row) => ({
        // not including null check for logs total, the table will handle errors and we want to
        //    display the other information if it can appear fine
        ratio: row.count / logsTotal,
        count: row.count,
        sample: row.sample,
        // SQL uses the simple (regex) method, whose punctuation-only anchors make the
        // token highlighter mis-align — same reason PPL's usingRegexPatterns path skips it.
        highlightedSample:
          isSqlPatterns || usingRegexPatterns
            ? undefined
            : highlightLogUsingPattern(row.sample, row.pattern, isDarkMode),
        pattern: row.pattern,
      })),
    [patternRows, logsTotal, usingRegexPatterns, isSqlPatterns, isDarkMode]
  );

  // Notify parent of filtered count change (optional callback)
  useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(patternRows.length);
    }
  }, [patternRows, onFilteredCountChange]);

  if (status?.status === QueryExecutionStatus.LOADING) {
    return (
      <EuiFlexGroup
        justifyContent="center"
        alignItems="center"
        style={{ minHeight: '400px' }}
        data-test-subj="patternsLoading"
      >
        <EuiFlexItem grow={false}>
          <EuiFlexGroup direction="column" alignItems="center" gutterSize="m">
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="xl" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText>
                {i18n.translate('explore.patterns.table.searchingInProgress', {
                  defaultMessage: 'Searching in progress...',
                })}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (!patternRows.length) {
    // If rows came back but none matched the expected pattern columns, the response schema
    // is unexpected; otherwise there is simply nothing to display.
    const rawHits = patternResults?.hits?.hits || [];
    if (rawHits.length > 0) {
      const title = i18n.translate('explore.patterns.schemaUnexpected', {
        defaultMessage: 'Expected schema not found',
      });
      return <EuiCallOut title={title} color="danger" iconType="alert" />;
    }
    return null;
  }

  return (
    <>
      {isFlyoutOpen && <PatternsTableFlyout />}
      <PatternsTable
        items={items}
        onFilterForPattern={filterForPattern}
        onFilterOutPattern={filterOutPattern}
      />
    </>
  );
};

export const PatternsContainer: React.FC<PatternsContainerContentProps> = ({
  onFilteredCountChange,
} = {}) => {
  return (
    <PatternsFlyoutProvider>
      <PatternsContainerContent onFilteredCountChange={onFilteredCountChange} />
    </PatternsFlyoutProvider>
  );
};
