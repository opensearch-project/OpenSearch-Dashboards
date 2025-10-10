/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiCallOut,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldStatsItem } from './field_stats_types';
import { TopValuesSection } from './detail_sections/top_values_section';
import { NumericSummarySection } from './detail_sections/numeric_summary_section';
import { DateRangeSection } from './detail_sections/date_range_section';
import { ExamplesSection } from './detail_sections/examples_section';

interface FieldStatsRowDetailsProps {
  field?: FieldStatsItem;
  details: any;
  isLoading?: boolean;
}

export const FieldStatsRowDetails: React.FC<FieldStatsRowDetailsProps> = ({
  field,
  details,
  isLoading,
}) => {
  if (!field) {
    return (
      <EuiCallOut
        color="warning"
        title={i18n.translate('explore.fieldStats.rowDetails.fieldInfoNotAvailable', {
          defaultMessage: 'Field information not available',
        })}
      />
    );
  }

  if (isLoading) {
    return (
      <EuiFlexGroup justifyContent="center" alignItems="center" style={{ padding: '2rem' }}>
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="m" />
          <EuiSpacer size="s" />
          <span>
            {i18n.translate('explore.fieldStats.rowDetails.loadingDetails', {
              defaultMessage: 'Loading details...',
            })}
          </span>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  if (details?.error) {
    return (
      <EuiCallOut
        color="danger"
        title={i18n.translate('explore.fieldStats.rowDetails.failedToLoadDetails', {
          defaultMessage: 'Failed to load details',
        })}
      />
    );
  }

  // Determine which sections to show based on what data is available
  const hasTopValues = details?.topValues && details.topValues.length > 0;
  const hasNumericSummary = details?.numericSummary;
  const hasDateRange = details?.dateRange;
  const hasExamples = details?.examples && details.examples.length > 0;

  return (
    <EuiFlexGroup
      direction="column"
      gutterSize="m"
      data-test-subj={`fieldStatsRowDetails-${field.name}`}
    >
      {hasTopValues && (
        <EuiFlexItem>
          <EuiPanel paddingSize="s">
            <EuiTitle size="xs">
              <h4>
                {i18n.translate('explore.fieldStats.rowDetails.topValuesTitle', {
                  defaultMessage: 'Top Values',
                })}
              </h4>
            </EuiTitle>
            <EuiSpacer size="s" />
            <TopValuesSection data={details.topValues} field={field} />
          </EuiPanel>
        </EuiFlexItem>
      )}

      {hasNumericSummary && (
        <EuiFlexItem>
          <EuiPanel paddingSize="s">
            <EuiTitle size="xs">
              <h4>
                {i18n.translate('explore.fieldStats.rowDetails.summaryStatisticsTitle', {
                  defaultMessage: 'Summary Statistics',
                })}
              </h4>
            </EuiTitle>
            <EuiSpacer size="s" />
            <NumericSummarySection data={details.numericSummary} field={field} />
          </EuiPanel>
        </EuiFlexItem>
      )}

      {hasDateRange && (
        <EuiFlexItem>
          <EuiPanel paddingSize="s">
            <EuiTitle size="xs">
              <h4>
                {i18n.translate('explore.fieldStats.rowDetails.dateRangeTitle', {
                  defaultMessage: 'Date Range',
                })}
              </h4>
            </EuiTitle>
            <EuiSpacer size="s" />
            <DateRangeSection data={details.dateRange} field={field} />
          </EuiPanel>
        </EuiFlexItem>
      )}

      {hasExamples && (
        <EuiFlexItem>
          <EuiPanel paddingSize="s">
            <EuiTitle size="xs">
              <h4>
                {i18n.translate('explore.fieldStats.rowDetails.examplesTitle', {
                  defaultMessage: 'Examples',
                })}
              </h4>
            </EuiTitle>
            <EuiSpacer size="s" />
            <ExamplesSection data={details.examples} field={field} />
          </EuiPanel>
        </EuiFlexItem>
      )}

      {!hasTopValues && !hasNumericSummary && !hasDateRange && !hasExamples && (
        <EuiFlexItem>
          <EuiCallOut
            title={i18n.translate('explore.fieldStats.rowDetails.noDetailsAvailable', {
              defaultMessage: 'No details available',
            })}
            iconType="iInCircle"
          >
            {i18n.translate('explore.fieldStats.rowDetails.noDetailsAvailableDescription', {
              defaultMessage: 'Details could not be retrieved for this field.',
            })}
          </EuiCallOut>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
