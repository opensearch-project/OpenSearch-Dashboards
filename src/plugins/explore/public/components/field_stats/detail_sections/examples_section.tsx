/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBasicTable, EuiBasicTableColumn } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldStatsItem } from '../field_stats_types';

interface ExampleValue {
  value: any;
}

interface ExamplesSectionProps {
  data: ExampleValue[];
  field: FieldStatsItem;
}

export const ExamplesSection: React.FC<ExamplesSectionProps> = ({ data }) => {
  const columns: Array<EuiBasicTableColumn<ExampleValue>> = [
    {
      field: 'value',
      name: i18n.translate('explore.fieldStats.examples.exampleValuesColumnLabel', {
        defaultMessage: 'Example Values',
      }),
      render: (value: any) => {
        if (typeof value === 'object' && value !== null) {
          return JSON.stringify(value);
        }
        return String(value);
      },
    },
  ];

  return (
    <EuiBasicTable items={data} columns={columns} compressed data-test-subj="examplesSection" />
  );
};
