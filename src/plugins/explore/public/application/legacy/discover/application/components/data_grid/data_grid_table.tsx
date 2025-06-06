/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { buildColumns } from '../../utils/columns';
import { DefaultDiscoverTable } from '../default_discover_table/default_discover_table';
import { SortOrder } from '../../../../../../types/saved_explore_types';

export interface DataGridTableProps {
  columns: string[];
  indexPattern: IndexPattern;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onMoveColumn: (colName: string, destination: number) => void;
  onRemoveColumn: (column: string) => void;
  hits?: number;
  onSort: (s: SortOrder[]) => void;
  rows: OpenSearchSearchHit[];
  sort: SortOrder[];
  title?: string;
  description?: string;
  isLoading?: boolean;
  showPagination?: boolean;
  scrollToTop?: () => void;
}

export const DataGridTable = ({
  columns,
  indexPattern,
  onAddColumn,
  onFilter,
  onMoveColumn,
  onRemoveColumn,
  onSort,
  sort,
  hits,
  rows,
  title = '',
  description = '',
  isLoading = false,
  showPagination,
  scrollToTop,
}: DataGridTableProps) => {
  let adjustedColumns = buildColumns(columns);
  // Handle the case where all fields/columns are removed except the time-field one
  if (
    adjustedColumns.length === 1 &&
    indexPattern &&
    adjustedColumns[0] === indexPattern.timeFieldName
  ) {
    adjustedColumns = [...adjustedColumns, '_source'];
  }

  const tablePanelProps = {
    paddingSize: 'none' as const,
    style: {
      margin: '0px',
    },
    color: 'transparent' as const,
  };

  return (
    <div
      data-render-complete={!isLoading}
      data-shared-item=""
      data-title={title}
      data-description={description}
      data-test-subj="discoverTable"
      className="eui-xScrollWithShadows"
    >
      <EuiPanel hasBorder={false} hasShadow={false} {...tablePanelProps}>
        <DefaultDiscoverTable
          columns={adjustedColumns}
          indexPattern={indexPattern}
          sort={sort}
          onSort={onSort}
          rows={rows}
          hits={hits}
          onAddColumn={onAddColumn}
          onMoveColumn={onMoveColumn}
          onRemoveColumn={onRemoveColumn}
          onFilter={onFilter}
          showPagination={showPagination}
          scrollToTop={scrollToTop}
        />
      </EuiPanel>
    </div>
  );
};
