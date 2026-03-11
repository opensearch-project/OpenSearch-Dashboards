/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './data_table.scss';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EuiSmallButtonEmpty, EuiCallOut, EuiProgress } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { IndexPattern, DataView as Dataset } from 'src/plugins/data/public';
import { TableHeader } from './table_header/table_header';
import {
  DocViewFilterFn,
  DocViewsRegistry,
  OpenSearchSearchHit,
} from '../../types/doc_views_types';
import { TableRow } from './table_row/table_row';
import { LegacyDisplayedColumn, SortOrder } from '../../helpers/data_table_helper';
import { Pagination } from './pagination/pagination';

export interface DataTableProps {
  columns: LegacyDisplayedColumn[];
  hits?: number;
  rows: Array<OpenSearchSearchHit<Record<string, any>>>;
  dataset: IndexPattern | Dataset;
  sampleSize: number;
  isShortDots: boolean;
  showPagination?: boolean;
  docViewsRegistry: DocViewsRegistry;
  onRemoveColumn?: (column: string) => void;
  onAddColumn?: (column: string) => void;
  onFilter: DocViewFilterFn;
  onClose?: () => void;
  scrollToTop?: () => void;
  expandedTableHeader?: string;
  wrapCellText?: boolean;
  sortOrder?: SortOrder[];
  onChangeSortOrder?: (sortOrder: SortOrder[]) => void;
}

const PAGINATED_PAGE_SIZE = 50;
const LAZY_LOAD_BATCH_SIZE = 50;

const DataTableUI = ({
  columns,
  hits,
  rows,
  dataset,
  sampleSize,
  isShortDots,
  docViewsRegistry,
  showPagination,
  onRemoveColumn,
  onAddColumn,
  onFilter,
  onClose,
  scrollToTop,
  expandedTableHeader,
  wrapCellText,
  sortOrder,
  onChangeSortOrder,
}: DataTableProps) => {
  const columnNames = columns.map((column) => column.name);

  // Infinite-scroll lazy loading: render rows in batches as the user scrolls down.
  // Only the IntersectionObserver drives new batches — no FPS monitoring needed.
  const [renderedRowCount, setRenderedRowCount] = useState(LAZY_LOAD_BATCH_SIZE);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Clean up previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (node && !showPagination) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              setRenderedRowCount((prev) => prev + LAZY_LOAD_BATCH_SIZE);
            }
          },
          { threshold: 0.1 }
        );
        observerRef.current.observe(node);
      }
    },
    [showPagination]
  );

  // Reset rendered count only when the base data changes (new query / sort),
  // not when rows change due to tree expansion (children inserted).
  const prevFirstRowIdRef = useRef<string | undefined>();
  const prevRowCountRef = useRef(rows.length);
  useEffect(() => {
    const firstId = rows[0]?._id || (rows[0]?._source as any)?.spanId;
    if (prevFirstRowIdRef.current !== firstId) {
      // New query / sort: reset lazy loading
      setRenderedRowCount(LAZY_LOAD_BATCH_SIZE);
    } else {
      // Expansion: grow rendered count to accommodate inserted children
      const delta = rows.length - prevRowCountRef.current;
      if (delta > 0) {
        setRenderedRowCount((prev) => prev + delta);
      }
    }
    prevFirstRowIdRef.current = firstId;
    prevRowCountRef.current = rows.length;
  }, [rows]);

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const visibleRows = showPagination ? rows : rows.slice(0, renderedRowCount);
  const hasMoreRows = !showPagination && renderedRowCount < rows.length;

  // Pagination state (only used when showPagination=true)
  const [displayedRows, setDisplayedRows] = useState(rows.slice(0, PAGINATED_PAGE_SIZE));
  const [currentRowCounts, setCurrentRowCounts] = useState({
    startRow: 0,
    endRow: rows.length < PAGINATED_PAGE_SIZE ? rows.length : PAGINATED_PAGE_SIZE,
  });
  const [activePage, setActivePage] = useState(0);
  const pageCount = Math.ceil(rows.length / PAGINATED_PAGE_SIZE);

  const goToPage = (pageNumber: number) => {
    const startRow = pageNumber * PAGINATED_PAGE_SIZE;
    const endRow =
      rows.length < pageNumber * PAGINATED_PAGE_SIZE + PAGINATED_PAGE_SIZE
        ? rows.length
        : pageNumber * PAGINATED_PAGE_SIZE + PAGINATED_PAGE_SIZE;
    setCurrentRowCounts({
      startRow,
      endRow,
    });
    setDisplayedRows(rows.slice(startRow, endRow));
    setActivePage(pageNumber);
  };

  return (
    <div className="agentTraces-table-container">
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
      <table
        data-test-subj="docTable"
        className={`agentTraces-table table${wrapCellText ? ' agentTraces-table--wrap' : ''}`}
      >
        <thead>
          <TableHeader
            displayedColumns={columns}
            onRemoveColumn={onRemoveColumn}
            sortOrder={sortOrder}
            onChangeSortOrder={onChangeSortOrder}
          />
        </thead>
        <tbody>
          {(showPagination ? displayedRows : visibleRows).map((row, index: number) => {
            return (
              <TableRow
                key={row._id || (row._source as any)?.spanId || index}
                row={row}
                index={index}
                columns={columnNames}
                dataset={dataset}
                onAddColumn={onAddColumn}
                onRemoveColumn={onRemoveColumn}
                onFilter={onFilter}
                onClose={onClose}
                isShortDots={isShortDots}
                docViewsRegistry={docViewsRegistry}
                expandedTableHeader={expandedTableHeader}
                wrapCellText={wrapCellText}
              />
            );
          })}
        </tbody>
      </table>
      {hasMoreRows && (
        <div ref={sentinelRef}>
          <EuiProgress size="xs" color="accent" data-test-subj="discoverRenderedRowsProgress" />
        </div>
      )}
      {!showPagination && rows.length === sampleSize && (
        <EuiCallOut className="agentTracesTable__footer" data-test-subj="discoverDocTableFooter">
          <FormattedMessage
            id="agentTraces.howToSeeOtherMatchingDocumentsDescription"
            defaultMessage="These are the first {sampleSize} documents matching
              your search, refine your search to see others."
            values={{ sampleSize }}
          />

          <EuiSmallButtonEmpty onClick={scrollToTop}>
            <FormattedMessage id="agentTraces.backToTopLinkText" defaultMessage="Back to top." />
          </EuiSmallButtonEmpty>
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
  );
};

export const DataTable = React.memo(DataTableUI);
