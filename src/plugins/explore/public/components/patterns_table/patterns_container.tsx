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
  const hits = useMemo(() => {
    const rawHits = patternResults?.hits?.hits || [];

    // Filter out rows where any required field is null
    return rawHits.filter((row: any) => {
      if (!row || !row._source) return false;

      const source = row._source;

      // If ANY required field is null/undefined, reject the entire row
      if (
        source[PATTERNS_FIELD] == null ||
        source[COUNT_FIELD] == null ||
        source[SAMPLE_FIELD] == null
      ) {
        return false;
      }

      // For SAMPLE_FIELD, also check if it's an array with a non-null first element
      if (
        !Array.isArray(source[SAMPLE_FIELD]) ||
        source[SAMPLE_FIELD].length === 0 ||
        source[SAMPLE_FIELD][0] == null
      ) {
        return false;
      }

      return true;
    });
  }, [patternResults?.hits.hits]);

  const items: PatternItem[] = useMemo(
    () =>
      hits?.map((row: any) => ({
        // not including null check for logs total, the table will handle errors and we want to
        //    display the other information if it can appear fine
        ratio: row._source[COUNT_FIELD] / logsTotal,
        count: row._source[COUNT_FIELD],
        // SAMPLE_FIELD needs [0] because the sample will be an array, but we're showing a 'sample' so 0th is fine
        sample: usingRegexPatterns
          ? row._source[SAMPLE_FIELD][0]
          : highlightLogUsingPattern(
              row._source[SAMPLE_FIELD][0],
              row._source[PATTERNS_FIELD],
              isDarkMode
            ),
        pattern: row._source[PATTERNS_FIELD],
      })),
    [hits, logsTotal, usingRegexPatterns, isDarkMode]
  );

  // Notify parent of filtered count change (optional callback)
  useEffect(() => {
    if (onFilteredCountChange && hits) {
      onFilteredCountChange(hits.length);
    }
  }, [hits, onFilteredCountChange]);

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

  const hit = hits?.[0];
  if (!hit) {
    return null;
  }

  // Check if the hit has all required fields in hit._source
  const requiredFields = [COUNT_FIELD, SAMPLE_FIELD, PATTERNS_FIELD];
  const hasAllRequiredFields = requiredFields.every((field) => field in hit._source);

  if (!hasAllRequiredFields) {
    // doesn't match normal fields or calcite fields
    const title = i18n.translate('explore.patterns.schemaUnexpected', {
      defaultMessage: 'Expected schema not found',
    });
    return <EuiCallOut title={title} color="danger" iconType="alert" />;
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
