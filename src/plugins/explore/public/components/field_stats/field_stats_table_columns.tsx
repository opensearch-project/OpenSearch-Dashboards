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
      width: '20%',
      render: (type: string) => (
        <span>
          <FieldIcon type={type} size="s" /> {type}
        </span>
      ),
    },
    {
      field: 'name',
      name: 'Field Name',
      sortable: true,
      width: '30%',
    },
    {
      field: 'docCount',
      name: 'Document Count',
      sortable: true,
      width: '20%',
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
      width: '20%',
      render: (count: number) => {
        return count?.toLocaleString() || '—';
      },
    },
  ];
};
