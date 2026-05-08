/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBasicTable, EuiBasicTableColumn } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldStatsItem, RareValue, DetailSectionConfig } from '../utils/field_stats_types';
import { executeFieldStatsQuery } from '../field_stats_queries';

/**
 * Query function to fetch rare values for a field
 */
const getRareValuesQuery = (index: string, fieldName: string, limit: number = 10): string => {
  return `source = ${index} | rare ${limit} \`${fieldName}\``;
};

/**
 * Component to display rare values section
 */
interface RareValuesSectionProps {
  data: RareValue[];
  field: FieldStatsItem;
}

const RareValuesSection: React.FC<RareValuesSectionProps> = ({ data, field }) => {
  const totalDocCount = field.docCount || 0;
  const itemsWithPercentages = data.map((item) => ({
    ...item,
    percentage:
      totalDocCount > 0 && item.count !== undefined ? (item.count / totalDocCount) * 100 : 0,
  }));

  const columns: Array<EuiBasicTableColumn<RareValue>> = [
    {
      field: 'value',
      name: i18n.translate('explore.fieldStats.rareValues.valueColumnLabel', {
        defaultMessage: 'Value',
      }),
      width: '60%',
      render: (value: string | number) => String(value),
    },
    {
      field: 'count',
      name: i18n.translate('explore.fieldStats.rareValues.countColumnLabel', {
        defaultMessage: 'Count',
      }),
      width: '20%',
      render: (count?: number) => (count !== undefined ? count.toLocaleString() : '—'),
    },
    {
      field: 'percentage',
      name: i18n.translate('explore.fieldStats.rareValues.percentageColumnLabel', {
        defaultMessage: 'Percentage',
      }),
      width: '20%',
      render: (percentage: number) => (percentage === 0 ? '—' : `${percentage.toFixed(1)}%`),
    },
  ];

  return (
    <EuiBasicTable
      items={itemsWithPercentages}
      columns={columns}
      compressed
      data-test-subj="rareValuesSection"
    />
  );
};

/**
 * Rare Values Detail Section Configuration
 * Displays the least common values
 */
export const rareValuesDetailConfig: DetailSectionConfig<RareValue[]> = {
  id: 'rareValues',
  title: i18n.translate('explore.fieldStats.rareValues.sectionTitle', {
    defaultMessage: 'Rare Values',
  }),
  applicableToTypes: ['string', 'keyword', 'number', 'ip', 'boolean'],
  fetchData: async (fieldName, dataset, services) => {
    const query = getRareValuesQuery(dataset.title, fieldName, 10);
    const result = await executeFieldStatsQuery(services, query, dataset.id || '', dataset.type);

    // Parse rare values from result
    const hits = result?.hits?.hits || [];
    return hits.map((hit: any) => {
      const source = hit._source || {};
      return {
        value: source[fieldName],
        count: source.count,
      };
    });
  },
  component: RareValuesSection,
};
