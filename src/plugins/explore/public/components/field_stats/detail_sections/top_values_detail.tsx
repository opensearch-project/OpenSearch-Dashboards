/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBasicTable, EuiBasicTableColumn } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldStatsItem, TopValue, DetailSectionConfig } from '../field_stats_types';
import { executeFieldStatsQuery } from '../field_stats_queries';

/**
 * Query function to fetch top values for a field
 */
const getTopValuesQuery = (index: string, fieldName: string, limit: number = 10): string => {
  return `source = ${index} | top ${limit} \`${fieldName}\``;
};

/**
 * Component to display top values section
 */
interface TopValuesSectionProps {
  data: TopValue[];
  field: FieldStatsItem;
}

const TopValuesSection: React.FC<TopValuesSectionProps> = ({ data, field }) => {
  const columns: Array<EuiBasicTableColumn<TopValue>> = [
    {
      field: 'value',
      name: i18n.translate('explore.fieldStats.topValues.valueColumnLabel', {
        defaultMessage: 'Value',
      }),
      width: '60%',
      render: (value: string | number) => String(value),
    },
    {
      field: 'count',
      name: i18n.translate('explore.fieldStats.topValues.countColumnLabel', {
        defaultMessage: 'Count',
      }),
      width: '20%',
      render: (count: number) => count.toLocaleString(),
    },
    {
      field: 'percentage',
      name: i18n.translate('explore.fieldStats.topValues.percentageColumnLabel', {
        defaultMessage: 'Percentage',
      }),
      width: '20%',
      render: (percentage: number) => `${percentage.toFixed(1)}%`,
    },
  ];

  return (
    <EuiBasicTable items={data} columns={columns} compressed data-test-subj="topValuesSection" />
  );
};

/**
 * Top Values Detail Section Configuration
 * Displays the most common values
 */
export const topValuesDetailConfig: DetailSectionConfig<TopValue[]> = {
  id: 'topValues',
  title: i18n.translate('explore.fieldStats.topValues.sectionTitle', {
    defaultMessage: 'Top Values',
  }),
  applicableToTypes: ['string', 'keyword', 'number', 'ip', 'boolean'],
  fetchData: async (fieldName, dataset, services) => {
    const query = getTopValuesQuery(dataset.title, fieldName, 10);
    const result = await executeFieldStatsQuery(services, query, dataset.id || '', dataset.type);

    // Parse top values from result
    const hits = result?.hits?.hits || [];
    return hits.map((hit: any) => {
      const source = hit._source || {};
      return {
        value: source[fieldName],
        count: source.count || 0,
        percentage: source.percentage || 0,
      };
    });
  },
  component: TopValuesSection,
};
