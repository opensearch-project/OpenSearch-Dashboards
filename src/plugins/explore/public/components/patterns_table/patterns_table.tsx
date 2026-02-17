/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CriteriaWithPagination, EuiBasicTable } from '@elastic/eui';
import { patternsTableColumns } from './patterns_table_columns';
import { usePatternsFlyoutContext } from './patterns_table_flyout/patterns_flyout_context';

export interface PatternsTableProps {
  items: PatternItem[];
  onFilterForPattern: (pattern: string) => void;
  onFilterOutPattern: (pattern: string) => void;
}

export interface PatternItem {
  sample: string;
  ratio: number;
  count: number;
  pattern: string;
}

const PatternsTableComponent = ({
  items,
  onFilterForPattern,
  onFilterOutPattern,
}: PatternsTableProps) => {
  const { openPatternsTableFlyout } = usePatternsFlyoutContext();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPageIndex(0);
  }, [items.length]);

  // Slice the items array based on pageIndex and pageSize
  const paginatedItems = items.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // TODO: When logs table is updated to use virtualization and infinite scrolling, update this table to have that as well
  return (
    <EuiBasicTable<PatternItem>
      items={paginatedItems}
      columns={patternsTableColumns(
        openPatternsTableFlyout,
        onFilterForPattern,
        onFilterOutPattern
      )}
      pagination={{ pageIndex, pageSize, totalItemCount: items.length }}
      onChange={({ page: { index, size } }: CriteriaWithPagination<PatternItem>) => {
        setPageIndex(index);
        setPageSize(size);
      }}
    />
  );
};

export const PatternsTable = React.memo(PatternsTableComponent);
