/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, ReactNode, useState } from 'react';
import {
  EuiBasicTable,
  EuiLoadingSpinner,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiSpacer,
  Direction,
} from '@elastic/eui';
import { FieldStatsItem } from './field_stats_types';
import { FieldStatsRowDetails } from './field_stats_row_details';
import { getFieldStatsColumns } from './field_stats_table_columns';

interface FieldStatsTableProps {
  items: FieldStatsItem[];
  expandedRows: Set<string>;
  fieldDetails: Record<string, any>;
  onRowExpand: (fieldName: string) => void;
  isLoading: boolean;
  detailsLoading: Set<string>;
}

export const FieldStatsTable: React.FC<FieldStatsTableProps> = ({
  items,
  expandedRows,
  fieldDetails,
  onRowExpand,
  isLoading,
  detailsLoading,
}) => {
  const [sortField, setSortField] = useState<keyof FieldStatsItem>('name');
  const [sortDirection, setSortDirection] = useState<Direction>('asc');

  const columns = useMemo(() => getFieldStatsColumns({ expandedRows, onRowExpand }), [
    expandedRows,
    onRowExpand,
  ]);

  const itemIdToExpandedRowMap = useMemo(() => {
    const map: Record<string, ReactNode> = {};
    expandedRows.forEach((fieldName) => {
      if (fieldDetails[fieldName]) {
        map[fieldName] = (
          <FieldStatsRowDetails
            field={items.find((item) => item.name === fieldName)}
            details={fieldDetails[fieldName]}
          />
        );
      }
    });
    return map;
  }, [expandedRows, fieldDetails, items]);

  // Sort items based on current sort state
  const sortedItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
    return sorted;
  }, [items, sortField, sortDirection]);

  const onTableChange = ({
    sort,
  }: {
    sort?: { field: keyof FieldStatsItem; direction: Direction };
  }) => {
    if (sort) {
      setSortField(sort.field);
      setSortDirection(sort.direction);
    }
  };

  // Show loading state while fetching field statistics
  if (isLoading) {
    return (
      <EuiFlexGroup
        justifyContent="center"
        alignItems="center"
        style={{ minHeight: '400px' }}
        data-test-subj="fieldStatsLoading"
      >
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="xl" />
          <EuiSpacer size="m" />
          <EuiText>Searching in progress...</EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  return (
    <EuiBasicTable
      items={sortedItems}
      columns={columns}
      itemId="name"
      itemIdToExpandedRowMap={itemIdToExpandedRowMap}
      isExpandable={true}
      sorting={{
        sort: {
          field: sortField,
          direction: sortDirection,
        },
        enableAllColumns: true,
      }}
      onChange={onTableChange}
      data-test-subj="fieldStatsTable"
    />
  );
};
