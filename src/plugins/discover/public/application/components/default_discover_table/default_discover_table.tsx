/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_doc_table.scss';

import React, { useEffect, useRef, useState } from 'react';
import { EuiDataGridColumn, EuiDataGridSorting } from '@elastic/eui';
import { TableHeader } from './table_header';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { TableRow } from './table_rows';
import { IndexPattern } from '../../../opensearch_dashboards_services';

export interface DefaultDiscoverTableProps {
  displayedTableColumns: EuiDataGridColumn[];
  columns: string[];
  rows: OpenSearchSearchHit[];
  indexPattern: IndexPattern;
  sortOrder: Array<{
    id: string;
    direction: 'asc' | 'desc';
  }>;
  onChangeSortOrder: (cols: EuiDataGridSorting['columns']) => void;
  onRemoveColumn: (column: string) => void;
  onReorderColumn: (col: string, source: number, destination: number) => void;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onClose: () => void;
}

export const LegacyDiscoverTable = ({
  displayedTableColumns,
  columns,
  rows,
  indexPattern,
  sortOrder,
  onChangeSortOrder,
  onRemoveColumn,
  onReorderColumn,
  onAddColumn,
  onFilter,
  onClose,
}: DefaultDiscoverTableProps) => {
  const [intersectingRows, setIntersectingRows] = useState([]);
  const tableRef = useRef(null);

  useEffect(() => {
    const options = {
      root: null, // viewport
      rootMargin: '0px',
      threshold: 0.5, // 50% of the element is visible
    };

    const observer = new IntersectionObserver((entries) => {
      const visibleRows = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => Number(entry.target.dataset.index));

      setIntersectingRows((prevIntersectingRows) => [...prevIntersectingRows, ...visibleRows]);
    }, options);

    const tableRows = tableRef.current.querySelectorAll('tbody tr');
    tableRows.forEach((row, index) => {
      observer.observe(row);
      row.dataset.index = index; // Storing the index for reference
    });

    return () => {
      observer.disconnect();
    };
  }, [rows, columns]); // Re-run if the data changes

  return (
    indexPattern && (
      <table data-test-subj="docTable" className="osd-table table" ref={tableRef}>
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
                opacity={intersectingRows.includes(index) ? 1 : 0}
                row={row}
                columnIds={displayedTableColumns.map((column) => column.id)}
                columns={columns}
                indexPattern={indexPattern}
                onRemoveColumn={onRemoveColumn}
                onAddColumn={onAddColumn}
                onFilter={onFilter}
                onClose={onClose}
              />
            );
          })}
        </tbody>
      </table>
    )
  );
};
