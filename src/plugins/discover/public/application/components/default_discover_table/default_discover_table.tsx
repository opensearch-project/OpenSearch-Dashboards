/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_doc_table.scss';

import React, { useState, useMemo, useCallback } from 'react';
import { EuiDataGridColumn } from '@elastic/eui';
import { TableHeader } from './table_header';
import { OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { TableRow } from './table_rows';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { SortOrder } from '../../../saved_searches/types';

export interface DefaultDiscoverTableProps {
  displayedTableColumns: EuiDataGridColumn[];
  rows: OpenSearchSearchHit[];
  indexPattern: IndexPattern;
  sortOrder: SortOrder[];
  onChangeSortOrder: (sort: SortOrder[]) => void;
  onRemoveColumn: (column: string) => void;
  onReorderColumn: (col: string, source: number, destination: number) => void;
}

export const DefaultDiscoverTable = ({
  displayedTableColumns,
  rows,
  indexPattern,
  sortOrder,
  onChangeSortOrder,
  onRemoveColumn,
  onReorderColumn,
}: DefaultDiscoverTableProps) => {
  // console.log("sorting", sorting)
  return (
    indexPattern && (
      <table data-test-subj="docTable" className="osd-table table">
        <thead>
          <TableHeader
            displayedTableColumns={displayedTableColumns}
            defaultSortOrder={''}
            // hideTimeColumn,
            indexPattern={indexPattern}
            // isShortDots,
            onChangeSortOrder={onChangeSortOrder}
            onReorderColumn={onReorderColumn}
            onRemoveColumn={onRemoveColumn}
            sortOrder={sortOrder}
          />
        </thead>
        <tbody>
          {rows.map((row: OpenSearchSearchHit, index: number) => {
            return (
              <TableRow
                key={row._id}
                row={row}
                rowIndex={index}
                columns={displayedTableColumns}
                indexPattern={indexPattern}
              />
            );
          })}
        </tbody>
      </table>
    )
  );
};
