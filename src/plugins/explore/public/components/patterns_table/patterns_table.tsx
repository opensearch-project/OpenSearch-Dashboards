/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CriteriaWithPagination, EuiBasicTable } from '@elastic/eui';
import { patternsTableColumns } from './constants';

export interface PatternsTableProps {
  items: PatternItem[];
}

export interface PatternItem {
  pattern: string;
  ratio: number;
  count: number;
}

export const PatternsTable = ({ items }: PatternsTableProps) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Slice the items array based on pageIndex and pageSize
  const paginatedItems = items.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  // TODO: When logs table is updated to use virtualization and infinite scrolling, update this table to have that as well
  return (
    <EuiBasicTable<PatternItem>
      items={paginatedItems}
      columns={patternsTableColumns}
      pagination={{ pageIndex, pageSize, totalItemCount: items.length }}
      onChange={({ page: { index, size } }: CriteriaWithPagination<PatternItem>) => {
        setPageIndex(index);
        setPageSize(size);
      }}
    />
  );
};
