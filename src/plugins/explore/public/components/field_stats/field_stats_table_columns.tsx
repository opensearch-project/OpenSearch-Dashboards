/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBasicTableColumn, EuiButtonIcon } from '@elastic/eui';
import { FieldStatsItem } from './field_stats_types';
import { FieldIcon } from '../../../../opensearch_dashboards_react/public';

interface GetFieldStatsColumnsParams {
  expandedRows: Set<string>;
  onRowExpand: (fieldName: string) => void;
}

export const getFieldStatsColumns = ({
  expandedRows,
  onRowExpand,
}: GetFieldStatsColumnsParams): Array<EuiBasicTableColumn<FieldStatsItem>> => {
  return [
    {
      width: '40px',
      isExpander: true,
      render: (item: FieldStatsItem) => (
        <EuiButtonIcon
          onClick={() => onRowExpand(item.name)}
          aria-label={expandedRows.has(item.name) ? 'Collapse' : 'Expand'}
          iconType={expandedRows.has(item.name) ? 'arrowDown' : 'arrowRight'}
          data-test-subj={`fieldStatsExpandButton-${item.name}`}
        />
      ),
    },
    {
      field: 'type',
      name: 'Type',
      sortable: true,
      width: '60px',
      align: 'center',
      render: (type: string) => <FieldIcon type={type} size="s" />,
    },
    {
      field: 'name',
      name: 'Field Name',
      sortable: true,
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      field: 'docCount',
      name: 'Document Count',
      sortable: true,
      width: '200px',
      align: 'right',
      render: (docCount: number, item: FieldStatsItem) => {
        return (
          <span>
            {docCount.toLocaleString()} ({item.docPercentage.toFixed(1)}%)
          </span>
        );
      },
    },
    {
      field: 'distinctCount',
      name: 'Distinct Values',
      sortable: true,
      width: '180px',
      align: 'right',
      render: (count: number) => {
        return count?.toLocaleString() || '—';
      },
    },
  ];
};
