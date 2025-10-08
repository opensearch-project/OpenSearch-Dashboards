/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiDescriptionList } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldStatsItem, NumericSummary } from '../field_stats_types';

interface NumericSummarySectionProps {
  data: NumericSummary;
  field: FieldStatsItem;
}

export const NumericSummarySection: React.FC<NumericSummarySectionProps> = ({ data }) => {
  return (
    <EuiDescriptionList
      type="inline"
      listItems={[
        {
          title: i18n.translate('explore.fieldStats.numericSummary.minLabel', {
            defaultMessage: 'Min',
          }),
          description: data.min?.toLocaleString() || '—',
        },
        {
          title: i18n.translate('explore.fieldStats.numericSummary.medianLabel', {
            defaultMessage: 'Median',
          }),
          description: data.median?.toLocaleString() || '—',
        },
        {
          title: i18n.translate('explore.fieldStats.numericSummary.averageLabel', {
            defaultMessage: 'Average',
          }),
          description: data.avg?.toLocaleString() || '—',
        },
        {
          title: i18n.translate('explore.fieldStats.numericSummary.maxLabel', {
            defaultMessage: 'Max',
          }),
          description: data.max?.toLocaleString() || '—',
        },
      ]}
      data-test-subj="numericSummarySection"
    />
  );
};
