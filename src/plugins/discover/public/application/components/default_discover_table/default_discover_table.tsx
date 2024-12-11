/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_doc_table.scss';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { EuiSmallButtonEmpty, EuiCallOut, EuiProgress } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { TableHeader } from './table_header';
import { DocViewFilterFn, OpenSearchSearchHit } from '../../doc_views/doc_views_types';
import { TableRow } from './table_row';
import { getServices, IndexPattern } from '../../../opensearch_dashboards_services';
import { Pagination } from './pagination';
import { getLegacyDisplayedColumns } from './helper';
import { SortDirection, SortOrder } from '../../../saved_searches/types';
import {
  DOC_HIDE_TIME_COLUMN_SETTING,
  SAMPLE_SIZE_SETTING,
  SORT_DEFAULT_ORDER_SETTING,
} from '../../../../common';
import { UI_SETTINGS } from '../../../../../data/common';

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
  onClose?: () => void;
  showPagination?: boolean;
  scrollToTop?: () => void;
}

// ToDo: These would need to be read from an upcoming config panel
const PAGINATED_PAGE_SIZE = 50;
const INFINITE_SCROLLED_PAGE_SIZE = 10;
// How far to queue unrendered rows ahead of time during infinite scrolling
const DESIRED_ROWS_LOOKAHEAD = 5 * INFINITE_SCROLLED_PAGE_SIZE;

const DefaultDiscoverTableUI = ({
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
  showPagination,
  scrollToTop,
}: DefaultDiscoverTableProps) => {
  const services = getServices();
  const [sampleSize, isShortDots, hideTimeColumn, defaultSortOrder] = useMemo(() => {
    return [
      services.uiSettings.get(SAMPLE_SIZE_SETTING),
      services.uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE),
      services.uiSettings.get(DOC_HIDE_TIME_COLUMN_SETTING),
      services.uiSettings.get(SORT_DEFAULT_ORDER_SETTING, 'desc') as SortDirection,
    ];
  }, [services.uiSettings]);

  const displayedColumns = getLegacyDisplayedColumns(
    columns,
    indexPattern,
    hideTimeColumn,
    isShortDots
  );
  const displayedColumnNames = displayedColumns.map((column) => column.name);

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
  // `tableElement` is used for first auto-sizing and then fixing column widths
  const [tableElement, setTableElement] = useState<HTMLTableElement>();
  // Both need callback refs since the elements aren't set on the first render.
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setSentinelElement(node);
    }
  }, []);
  const tableRef = useCallback((el: HTMLTableElement | null) => {
    if (el !== null) {
      setTableElement(el);
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

  // Allow auto column-sizing using the initially rendered rows and then convert to fixed
  const tableLayoutRequestFrameRef = useRef<number>(0);

  /* In asynchronous data loading, column metadata may arrive before the corresponding data, resulting in
     layout being calculated for the new column definitions using the old data. To mitigate this issue, we
     additionally trigger a recalculation when a change is observed in the index that the data attributes
     itself to. This ensures a re-layout is performed when new data is loaded or the column definitions
     change, effectively addressing the symptoms of the race condition.
   */
  const indexOfRenderedData = rows?.[0]?._index;
  const timeFromFirstRow =
    typeof indexPattern?.timeFieldName === 'string' &&
    rows?.[0]?._source?.[indexPattern.timeFieldName];

  useEffect(() => {
    if (tableElement) {
      // Load the first batch of rows and adjust the columns to the contents
      tableElement.style.tableLayout = 'auto';
      // To prevent influencing the auto-sizing, unset the widths from a previous render
      tableElement.querySelectorAll('thead > tr > th:not(:first-child)').forEach((th) => {
        (th as HTMLTableCellElement).style.width = 'unset';
      });

      tableLayoutRequestFrameRef.current = requestAnimationFrame(() => {
        if (tableElement) {
          /* Get the widths for each header cell which is the column's width automatically adjusted to the content of
           * the column. Apply the width as a style and change the layout to fixed. This is to
           *   1) prevent columns from changing size when more rows are added, and
           *   2) speed of rendering time of subsequently added rows.
           *
           * First cell is skipped because it has a fixed dimension set already.
           */
          tableElement.querySelectorAll('thead > tr > th:not(:first-child)').forEach((th) => {
            (th as HTMLTableCellElement).style.width = th.getBoundingClientRect().width + 'px';
          });

          tableElement.style.tableLayout = 'fixed';
        }
      });
    }

    return () => cancelAnimationFrame(tableLayoutRequestFrameRef.current);
  }, [columns, tableElement, indexOfRenderedData, timeFromFirstRow]);

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
        <table data-test-subj="docTable" className="osd-table table" ref={tableRef}>
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
                    key={row._id}
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
          <EuiCallOut className="dscTable__footer" data-test-subj="discoverDocTableFooter">
            <FormattedMessage
              id="discover.howToSeeOtherMatchingDocumentsDescription"
              defaultMessage="These are the first {sampleSize} documents matching
              your search, refine your search to see others."
              values={{ sampleSize }}
            />

            <EuiSmallButtonEmpty onClick={scrollToTop}>
              <FormattedMessage id="discover.backToTopLinkText" defaultMessage="Back to top." />
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
      </>
    )
  );
};

export const DefaultDiscoverTable = React.memo(DefaultDiscoverTableUI);
