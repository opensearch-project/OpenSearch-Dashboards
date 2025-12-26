/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { PatternItem, PatternsTable } from './patterns_table';
import { COUNT_FIELD, PATTERNS_FIELD, SAMPLE_FIELD } from './utils/constants';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { highlightLogUsingPattern } from './utils/utils';
import { selectUsingRegexPatterns } from '../../application/utils/state_management/selectors';
import { PatternsTableFlyout } from './patterns_table_flyout/patterns_table_flyout';
import {
  PatternsFlyoutProvider,
  usePatternsFlyoutContext,
} from './patterns_table_flyout/patterns_flyout_context';
import { useHistogramResults } from '../../application/utils/hooks/use_histogram_results';
import { QueryExecutionStatus } from '../../application/utils/state_management/types';

const PatternsContainerContent = () => {
  const { isFlyoutOpen } = usePatternsFlyoutContext();

  /**
   * Fetching the hits from the patterns query, and processing them for the table
   */
  const { results: patternResults, status } = useTabResults();
  const { results: histogramResults } = useHistogramResults();

  const usingRegexPatterns = useSelector(selectUsingRegexPatterns);

  const logsTotal = histogramResults?.hits.total || 0;
  const hits = useMemo(() => patternResults?.hits?.hits || [], [patternResults?.hits.hits]);

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
          : highlightLogUsingPattern(row._source[SAMPLE_FIELD][0], row._source[PATTERNS_FIELD]),
        flyout: {
          pattern: row._source[PATTERNS_FIELD],
          count: row._source[COUNT_FIELD],
          sample: row._source[SAMPLE_FIELD],
        },
      })),
    [hits, logsTotal, usingRegexPatterns]
  );

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
      <PatternsTable items={items} />
    </>
  );
};

export const PatternsContainer = () => {
  return (
    <PatternsFlyoutProvider>
      <PatternsContainerContent />
    </PatternsFlyoutProvider>
  );
};
