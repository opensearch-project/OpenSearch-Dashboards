/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_doc_table.scss';

import React, { useEffect, useRef, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiCallOut,
  EuiProgress,
  EuiPagination,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { TableHeader } from './table_header';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { TableRow } from './table_rows';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { SortOrder } from './helper';
import { getLegacyDisplayedColumns } from './helper';

export interface DefaultDiscoverTableProps {
  columns: string[];
  rows: OpenSearchSearchHit[];
  indexPattern: IndexPattern;
  sort: SortOrder[];
  onSort: (s: SortOrder[]) => void;
  onRemoveColumn: (column: string) => void;
  onReorderColumn: (colName: string, destination: number) => void;
  onAddColumn: (column: string) => void;
  onFilter: DocViewFilterFn;
  onClose: () => void;
  sampleSize: number;
  isShortDots: boolean;
  hideTimeColumn: boolean;
  defaultSortOrder: string;
  showPagination?: boolean;
}

export const LegacyDiscoverTable = ({
  columns,
  rows,
  indexPattern,
  sort,
  onSort,
  onRemoveColumn,
  onReorderColumn,
  onAddColumn,
  onFilter,
  onClose,
  sampleSize,
  isShortDots,
  hideTimeColumn,
  defaultSortOrder,
  showPagination,
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
      <>
        {showPagination ? (
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiPagination
                pageCount={pageCount}
                activePage={activePage}
                onPageClick={(currentPage) => goToPage(currentPage)}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <FormattedMessage
                id="discover.docTable.pagerControl.pagesCountLabel"
                defaultMessage="{startItem}&ndash;{endItem} of {totalItems}"
                values={{
                  startItem: currentRowCounts.startRow,
                  endItem: currentRowCounts.endRow,
                  totalItems: rows.length,
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : null}
        <table data-test-subj="docTable" className="osd-table table">
          <thead>
            <TableHeader
              displayedColumns={displayedColumns}
              defaultSortOrder={defaultSortOrder}
              indexPattern={indexPattern}
              onChangeSortOrder={onSort}
              onReorderColumn={onReorderColumn}
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

            <EuiButtonEmpty onClick={() => window.scrollTo(0, 0)}>
              <FormattedMessage id="discover.backToTopLinkText" defaultMessage="Back to top." />
            </EuiButtonEmpty>
          </EuiCallOut>
        )}
      </>
    )
  );
};
