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
  Direction,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FieldStatsItem, FieldDetails } from './field_stats_types';
import { FieldStatsRowDetails } from './field_stats_row_details';
import { getFieldStatsColumns } from './field_stats_table_columns';

interface FieldStatsTableProps {
  items: FieldStatsItem[];
  expandedRows: Set<string>;
  fieldDetails: Record<string, FieldDetails>;
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
      const field = items.find((item) => item.name === fieldName);
      const isLoadingDetails = detailsLoading.has(fieldName);

      map[fieldName] = (
        <FieldStatsRowDetails
          field={field}
          details={fieldDetails[fieldName]}
          isLoading={isLoadingDetails}
        />
      );
    });
    return map;
  }, [expandedRows, fieldDetails, items, detailsLoading]);

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

  if (isLoading) {
    return (
      <EuiFlexGroup
        justifyContent="center"
        alignItems="center"
        style={{ minHeight: '400px' }}
        data-test-subj="fieldStatsLoading"
      >
        <EuiFlexItem grow={false}>
          <EuiFlexGroup direction="column" alignItems="center" gutterSize="m">
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="xl" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText>
                {i18n.translate('explore.fieldStats.table.searchingInProgress', {
                  defaultMessage: 'Searching in progress...',
                })}
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
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
