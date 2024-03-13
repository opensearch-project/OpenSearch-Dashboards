/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_doc_table.scss';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EuiButtonEmpty, EuiCallOut, EuiProgress } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { TableHeader } from './table_header';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { TableRow } from './table_rows';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { Pagination } from './pagination';
import { getLegacyDisplayedColumns } from './helper';
import { SortDirection, SortOrder } from '../../../saved_searches/types';

export interface DefaultDiscoverTableProps {
  columns: string[];
  hits?: number;
  rows: OpenSearchSearchHit[];
  indexPattern: IndexPattern;
  sort: SortOrder[];
  onSort: (s: SortOrder[]) => void;
  onRemoveColumn: (column: string) => void;
  onMoveColumn: (colName: string, destination: number) => void;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onClose: () => void;
  sampleSize: number;
  isShortDots: boolean;
  hideTimeColumn: boolean;
  defaultSortOrder: SortDirection;
  showPagination?: boolean;
  scrollToTop?: () => void;
}

export const LegacyDiscoverTable = ({
  columns,
  hits,
  rows,
  indexPattern,
  sort,
  onSort,
  onRemoveColumn,
  onMoveColumn,
  onAddColumn,
  onFilter,
  onClose,
  sampleSize,
  isShortDots,
  hideTimeColumn,
  defaultSortOrder,
  showPagination,
  scrollToTop,
}: DefaultDiscoverTableProps) => {
  const displayedColumns = getLegacyDisplayedColumns(
    columns,
    indexPattern,
    hideTimeColumn,
    isShortDots
  );
  const displayedColumnNames = displayedColumns.map((column) => column.name);
  const pageSize = 50;
  const [renderedRowCount, setRenderedRowCount] = useState(50); // Start with 50 rows
  const [displayedRows, setDisplayedRows] = useState(rows.slice(0, pageSize));
  const [currentRowCounts, setCurrentRowCounts] = useState({
    startRow: 0,
    endRow: rows.length < pageSize ? rows.length : pageSize,
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [sentinelEle, setSentinelEle] = useState<HTMLDivElement>();
  // Need a callback ref since the element isnt set on the first render.
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setSentinelEle(node);
    }
  }, []);

  useEffect(() => {
    if (sentinelEle) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setRenderedRowCount((prevRowCount) => prevRowCount + 50); // Load 50 more rows
          }
        },
        { threshold: 1.0 }
      );

      observerRef.current.observe(sentinelEle);
    }

    return () => {
      if (observerRef.current && sentinelEle) {
        observerRef.current.unobserve(sentinelEle);
      }
    };
  }, [sentinelEle]);

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
      <>
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
              displayedColumns={displayedColumns}
              defaultSortOrder={defaultSortOrder}
              indexPattern={indexPattern}
              onChangeSortOrder={onSort}
              onMoveColumn={onMoveColumn}
              onRemoveColumn={onRemoveColumn}
              sortOrder={sort}
            />
          </thead>
          <tbody>
            {(showPagination ? displayedRows : rows.slice(0, renderedRowCount)).map(
              (row: OpenSearchSearchHit, index: number) => {
                return (
                  <TableRow
                    key={index}
                    row={row}
                    columns={displayedColumnNames}
                    indexPattern={indexPattern}
                    onRemoveColumn={onRemoveColumn}
                    onAddColumn={onAddColumn}
                    onFilter={onFilter}
                    onClose={onClose}
                    isShortDots={isShortDots}
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

            <EuiButtonEmpty onClick={scrollToTop}>
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
      </>
    )
  );
};
