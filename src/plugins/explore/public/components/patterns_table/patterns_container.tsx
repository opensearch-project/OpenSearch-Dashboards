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
  isValidFiniteNumber,
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

  const histogramTotal = histogramResults?.hits.total || 0;

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
          // Columns are read by position. The engine returns each unaliased
          // column's `name` as the raw SELECT-list text, and OSD keys `_source`
          // by that name (aliases are returned separately and dropped), so the
          // schema is the only reliable way to address them.
          const [patternCol, countCol, sampleCol] = schema;
          if (!patternCol?.name || !countCol?.name || !sampleCol?.name) return null;
          pattern = source[patternCol.name];
          count = source[countCol.name];
          sample = source[sampleCol.name];
        } else {
          pattern = source[PATTERNS_FIELD];
          count = source[COUNT_FIELD];
          // PPL sample is an array (take(field, 1))
          sample = Array.isArray(source[SAMPLE_FIELD]) ? source[SAMPLE_FIELD][0] : undefined;
        }

        // Note for SQL: the empty-pattern group (documents whose patterns field
        // is missing) has pattern === '' and sample === '', which survive this
        // check -- only null/undefined are dropped. The outer IFNULL on MIN
        // guarantees the sample is never null, so that group is not lost.
        if (pattern == null || count == null || sample == null) return null;
        return { pattern, count, sample };
      })
      .filter(Boolean) as Array<{ pattern: string; count: number; sample: string }>;
  }, [patternResults, isSqlPatterns]);

  // Denominator for the event ratio. PPL reads the total from the histogram
  // query, but the histogram is not issued for SQL (see the language guard in
  // `executeQueries`), so that total is always 0 and every ratio would come out
  // Infinity -- rendering the whole column as '—'.
  //
  // The SQL query carries the count of matched documents in a fourth column
  // (MAX(doc_total)). Summing the returned counts instead would be wrong when the
  // engine caps the response at `plugins.query.size_limit`: the groups that came
  // back would be normalized to 100% and every ratio overstated. Falls back to the
  // sum when the column is absent, so a response predating this shape still renders.
  const logsTotal = useMemo(() => {
    if (!isSqlPatterns) return histogramTotal;

    const totalColumn = ((patternResults as any)?.fieldSchema || [])[3];
    const reportedTotal = totalColumn?.name
      ? patternResults?.hits?.hits?.[0]?._source?.[totalColumn.name]
      : undefined;
    if (isValidFiniteNumber(reportedTotal) && reportedTotal > 0) return reportedTotal;

    return patternRows.reduce((sum, row) => sum + (row.count || 0), 0);
  }, [isSqlPatterns, patternResults, patternRows, histogramTotal]);

  const items: PatternItem[] = useMemo(
    () =>
      patternRows.map((row) => ({
        // not including null check for logs total, the table will handle errors and we want to
        //    display the other information if it can appear fine
        ratio: row.count / logsTotal,
        count: row.count,
        sample: row.sample,
        // Highlighting is skipped for the simple pattern method, in SQL exactly
        // as in PPL's usingRegexPatterns path -- SQL only has the simple method.
        // It is not that the highlighter mis-aligns: it aligns correctly and
        // reproduces the sample byte-for-byte. The problem is density. Simple
        // patterns replace every alphanumeric run, so the same log line comes
        // back as ~25 alternating fragments instead of brain's ~6 contiguous
        // ones, at the same ~66% coverage -- the highlight stops distinguishing
        // anything and reads as noise.
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
    // SQL addresses the columns through the response schema, so rows arriving with
    // no usable schema is worth reporting. PPL keeps returning nothing, as before.
    const rawHits = patternResults?.hits?.hits || [];
    if (isSqlPatterns && rawHits.length > 0) {
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
