/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiTitle, EuiSpacer, EuiCallOut } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { FieldStatsItem } from './field_stats_types';
import { TopValuesSection } from './detail_sections/top_values_section';
import { NumericSummarySection } from './detail_sections/numeric_summary_section';
import { DateRangeSection } from './detail_sections/date_range_section';
import { ExamplesSection } from './detail_sections/examples_section';

interface FieldStatsRowDetailsProps {
  field?: FieldStatsItem;
  details: any;
}

// Helper to generate mocked top values
const getMockedTopValues = (fieldName: string, fieldType: string) => {
  const limit = fieldType === 'boolean' ? 2 : 10;
  return Array.from({ length: limit }, (_, i) => ({
    value: fieldType === 'boolean' ? (i === 0 ? 'true' : 'false') : `${fieldName}_value_${i + 1}`,
    count: Math.floor(Math.random() * 1000),
    percentage: Math.random() * 100,
  }));
};

// Helper to generate mocked numeric summary
const getMockedNumericSummary = () => ({
  min: Math.floor(Math.random() * 100),
  median: Math.floor(Math.random() * 500) + 100,
  avg: Math.floor(Math.random() * 500) + 200,
  max: Math.floor(Math.random() * 1000) + 500,
});

// Helper to generate mocked date range
const getMockedDateRange = () => ({
  earliest: moment().subtract(30, 'days').toISOString(),
  latest: moment().toISOString(),
});

// Helper to generate mocked example values
const getMockedExamples = (fieldName: string, fieldType: string) => {
  return Array.from({ length: 10 }, (_, i) => ({
    value: `${fieldName}_example_${i + 1}`,
  }));
};

export const FieldStatsRowDetails: React.FC<FieldStatsRowDetailsProps> = ({ field, details }) => {
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

  const fieldType = field.type.toLowerCase();

  // Determine which sections to show based on field type
  const showTopValues = ['string', 'keyword', 'number', 'ip', 'boolean'].includes(fieldType);
  const showNumericSummary = fieldType === 'number';
  const showDateRange = fieldType === 'date';

  return (
    <EuiFlexGroup
      direction="column"
      gutterSize="m"
      data-test-subj={`fieldStatsRowDetails-${field.name}`}
    >
      {showTopValues && (
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
            <TopValuesSection data={getMockedTopValues(field.name, fieldType)} field={field} />
          </EuiPanel>
        </EuiFlexItem>
      )}

      {showNumericSummary && (
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
            <NumericSummarySection data={getMockedNumericSummary()} field={field} />
          </EuiPanel>
        </EuiFlexItem>
      )}

      {showDateRange && (
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
            <DateRangeSection data={getMockedDateRange()} field={field} />
          </EuiPanel>
        </EuiFlexItem>
      )}

      {!showTopValues && !showNumericSummary && !showDateRange && (
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
            <ExamplesSection data={getMockedExamples(field.name, fieldType)} field={field} />
          </EuiPanel>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
