/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBasicTable, EuiBasicTableColumn } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldStatsItem, TopValue } from '../field_stats_types';

interface TopValuesSectionProps {
  data: TopValue[];
  field: FieldStatsItem;
}

export const TopValuesSection: React.FC<TopValuesSectionProps> = ({ data }) => {
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
