/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_doc_table.scss';

import React, { useEffect, useRef, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiCallOut,
  EuiDataGridColumn,
  EuiDataGridSorting,
  EuiProgress,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { TableHeader } from './table_header';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { TableRow } from './table_rows';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { Pagination } from './pagination';

export interface DefaultDiscoverTableProps {
  displayedTableColumns: EuiDataGridColumn[];
  columns: string[];
  hits?: number;
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
  sampleSize: number;
  showPagination?: boolean;
}

export const LegacyDiscoverTable = ({
  displayedTableColumns,
  columns,
  hits,
  rows,
  indexPattern,
  sortOrder,
  onChangeSortOrder,
  onRemoveColumn,
  onReorderColumn,
  onAddColumn,
  onFilter,
  onClose,
  sampleSize,
  showPagination,
}: DefaultDiscoverTableProps) => {
  const pageSize = 50;
  const [renderedRowCount, setRenderedRowCount] = useState(50); // Start with 50 rows
  const [displayedRows, setDisplayedRows] = useState(rows.slice(0, pageSize));
  const [currentRowCounts, setCurrentRowCounts] = useState({
    startRow: 0,
    endRow: pageSize,
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMoreRows = () => {
    setRenderedRowCount((prevRowCount) => prevRowCount + 50); // Load 50 more rows
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRows();
        }
      },
      { threshold: 1.0 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current && sentinel) {
        observerRef.current.unobserve(sentinel);
      }
    };
  }, []);

  const [activePage, setActivePage] = useState(0);
  const pageCount = Math.ceil(rows.length / pageSize);

  const goToPage = (pageNumber: number) => {
    const startRow = pageNumber * pageSize;
    const endRow =
      rows.length < pageNumber * pageSize + pageSize
        ? rows.length
        : pageNumber * pageSize + pageSize;
    setCurrentRowCounts({
      startRow,
      endRow,
    });
    setDisplayedRows(rows.slice(startRow, endRow));
    setActivePage(pageNumber);
  };

  return (
    indexPattern && (
      <div>
        {showPagination ? (
          <Pagination
            pageCount={pageCount}
            activePage={activePage}
            goToPage={goToPage}
            startItem={currentRowCounts.startRow + 1}
            endItem={currentRowCounts.endRow}
            totalItems={hits}
            sampleSize={sampleSize}
          />
        ) : null}
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
            {(showPagination ? displayedRows : rows.slice(0, renderedRowCount)).map(
              (row: OpenSearchSearchHit, index: number) => {
                return (
                  <TableRow
                    key={index}
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
              }
            )}
          </tbody>
        </table>
        {!showPagination && renderedRowCount < rows.length && (
          <div ref={sentinelRef}>
            <EuiProgress size="xs" color="accent" />
          </div>
        )}
        {!showPagination && rows.length === sampleSize && (
          <EuiCallOut className="dscTable__footer" data-test-subj="discoverDocTableFooter">
            <FormattedMessage
              id="discover.howToSeeOtherMatchingDocumentsDescription"
              defaultMessage="These are the first {sampleSize} documents matching
              your search, refine your search to see others."
              values={{ sampleSize }}
            />

            <EuiButtonEmpty onClick={() => window.scrollTo(0, 0)}>
              <FormattedMessage id="discover.backToTopLinkText" defaultMessage="Back to top." />
            </EuiButtonEmpty>
          </EuiCallOut>
        )}
        {showPagination ? (
          <Pagination
            pageCount={pageCount}
            activePage={activePage}
            goToPage={goToPage}
            startItem={currentRowCounts.startRow + 1}
            endItem={currentRowCounts.endRow}
            totalItems={hits}
            sampleSize={sampleSize}
          />
        ) : null}
      </div>
    )
  );
};
