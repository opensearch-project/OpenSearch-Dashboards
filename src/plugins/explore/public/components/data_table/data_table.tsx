/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './data_table.scss';

import React, { useEffect, useRef, useState, useCallback } from 'react';
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
import { LegacyDisplayedColumn } from '../../helpers/data_table_helper';
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
}

// ToDo: These would need to be read from an upcoming config panel
const PAGINATED_PAGE_SIZE = 50;
const INFINITE_SCROLLED_PAGE_SIZE = 10;
// How far to queue unrendered rows ahead of time during infinite scrolling
const DESIRED_ROWS_LOOKAHEAD = 5 * INFINITE_SCROLLED_PAGE_SIZE;

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
}: DataTableProps) => {
  const columnNames = columns.map((column) => column.name);

  /* INFINITE_SCROLLED_PAGE_SIZE:
   * Infinitely scrolling, a page of 10 rows is shown and then 4 pages are lazy-loaded for a total of 5 pages.
   *   * The lazy-loading is mindful of the performance by monitoring the fps of the browser.
   *   *`renderedRowCount` and `desiredRowCount` are only used in this method.
   *
   * PAGINATED_PAGE_SIZE
   * Paginated, the view is broken into pages of 50 rows.
   *   * `displayedRows` and `currentRowCounts` are only used in this method.
   */
  const [renderedRowCount, setRenderedRowCount] = useState(INFINITE_SCROLLED_PAGE_SIZE);
  const [desiredRowCount, setDesiredRowCount] = useState(
    Math.min(rows.length, DESIRED_ROWS_LOOKAHEAD)
  );
  const [displayedRows, setDisplayedRows] = useState(rows.slice(0, PAGINATED_PAGE_SIZE));
  const [currentRowCounts, setCurrentRowCounts] = useState({
    startRow: 0,
    endRow: rows.length < PAGINATED_PAGE_SIZE ? rows.length : PAGINATED_PAGE_SIZE,
  });

  const observerRef = useRef<IntersectionObserver | null>(null);
  // `sentinelElement` is attached to the bottom of the table to observe when the table is scrolled all the way.
  const [sentinelElement, setSentinelElement] = useState<HTMLDivElement>();
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setSentinelElement(node);
    }
  }, []);

  useEffect(() => {
    if (sentinelElement && !showPagination) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            // Load another batch of rows, some immediately and some lazily
            setRenderedRowCount((prevRowCount) => prevRowCount + INFINITE_SCROLLED_PAGE_SIZE);
            setDesiredRowCount((prevRowCount) => prevRowCount + DESIRED_ROWS_LOOKAHEAD);
          }
        },
        {
          // Important that 0 < threshold < 1, since there OSD application div has a transparent
          // fade at the bottom which causes the sentinel element to sometimes not be 100% visible
          threshold: 0.1,
        }
      );

      observerRef.current.observe(sentinelElement);
    }

    return () => {
      if (observerRef.current && sentinelElement) {
        observerRef.current.unobserve(sentinelElement);
      }
    };
  }, [sentinelElement, showPagination]);

  // Page management when using a paginated table
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

  // Lazy-loader of rows
  const lazyLoadRequestFrameRef = useRef<number>(0);
  const lazyLoadLastTimeRef = useRef<number>(0);

  // When doing infinite scrolling, the `rows` prop gets regularly updated from the outside: we only
  // render the additional rows when we know the load isn't too high. To prevent overloading the
  // renderer, we throttle by current framerate and only render if the frames are fast enough, then
  // we increase the rendered row count and trigger a re-render.
  React.useEffect(() => {
    if (!showPagination) {
      const loadMoreRows = (time: number) => {
        if (renderedRowCount < desiredRowCount) {
          // Load more rows only if fps > 30, when calls are less than 33ms apart
          if (time - lazyLoadLastTimeRef.current < 33) {
            setRenderedRowCount((prevRowCount) => prevRowCount + INFINITE_SCROLLED_PAGE_SIZE);
          }
          lazyLoadLastTimeRef.current = time;
          lazyLoadRequestFrameRef.current = requestAnimationFrame(loadMoreRows);
        }
      };
      lazyLoadRequestFrameRef.current = requestAnimationFrame(loadMoreRows);
    }

    return () => cancelAnimationFrame(lazyLoadRequestFrameRef.current);
  }, [showPagination, renderedRowCount, desiredRowCount]);

  return (
    <div className="explore-table-container">
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
        className={`explore-table table${wrapCellText ? ' explore-table--wrap' : ''}`}
      >
        <thead>
          <TableHeader displayedColumns={columns} onRemoveColumn={onRemoveColumn} />
        </thead>
        <tbody>
          {(showPagination ? displayedRows : rows.slice(0, renderedRowCount)).map(
            (row, index: number) => {
              return (
                <TableRow
                  key={row._id}
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
            }
          )}
        </tbody>
      </table>
      {!showPagination && renderedRowCount < rows.length && (
        <div ref={sentinelRef}>
          <EuiProgress
            size="xs"
            color="accent"
            data-test-subj="discoverRenderedRowsProgress"
            style={{
              // Add a little margin if we aren't rendering the truncation callout below, to make
              // the progress bar render better when it's not present
              marginBottom: rows.length !== sampleSize ? '5px' : '0',
            }}
          />
        </div>
      )}
      {!showPagination && rows.length === sampleSize && (
        <EuiCallOut className="exploreTable__footer" data-test-subj="discoverDocTableFooter">
          <FormattedMessage
            id="explore.howToSeeOtherMatchingDocumentsDescription"
            defaultMessage="These are the first {sampleSize} documents matching
              your search, refine your search to see others."
            values={{ sampleSize }}
          />

          <EuiSmallButtonEmpty onClick={scrollToTop}>
            <FormattedMessage id="explore.backToTopLinkText" defaultMessage="Back to top." />
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
