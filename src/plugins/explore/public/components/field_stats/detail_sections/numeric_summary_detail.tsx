/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiDescriptionList } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldStatsItem, NumericSummary, DetailSectionConfig } from '../field_stats_types';
import { executeFieldStatsQuery } from '../field_stats_queries';

/**
 * Query function to fetch numeric summary statistics
 */
const getNumericSummaryQuery = (index: string, fieldName: string): string => {
  return `source = ${index}
    | stats min(\`${fieldName}\`) as min,
            percentile(\`${fieldName}\`, 50) as median,
            avg(\`${fieldName}\`) as avg,
            max(\`${fieldName}\`) as max`;
};

/**
 * Component to display numeric summary statistics
 */
interface NumericSummarySectionProps {
  data: NumericSummary;
  field: FieldStatsItem;
}

const NumericSummarySection: React.FC<NumericSummarySectionProps> = ({ data, field }) => {
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

/**
 * Numeric Summary Detail Section Configuration
 * Displays statistical summary
 */
export const numericSummaryDetailConfig: DetailSectionConfig<NumericSummary> = {
  id: 'numericSummary',
  title: i18n.translate('explore.fieldStats.numericSummary.sectionTitle', {
    defaultMessage: 'Summary Statistics',
  }),
  applicableToTypes: ['number'],
  fetchData: async (fieldName, dataset, services) => {
    const query = getNumericSummaryQuery(dataset.title, fieldName);
    const result = await executeFieldStatsQuery(services, query, dataset.id || '', dataset.type);

    const hits = result?.hits?.hits || [];
    const stats = hits[0]?._source || {};
    return {
      min: stats.min || 0,
      median: stats.median || 0,
      avg: stats.avg || 0,
      max: stats.max || 0,
    };
  },
  component: NumericSummarySection,
};
