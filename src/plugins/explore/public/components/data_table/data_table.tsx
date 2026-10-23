/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './data_table.scss';

import React, { useState } from 'react';
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
import { useIncrementalRender } from '../../helpers/use_incremental_render';

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
   *   * A sentinel element attached to the bottom of the table loads the next batch when scrolled into view.
   *
   * PAGINATED_PAGE_SIZE
   * Paginated, the view is broken into pages of 50 rows.
   *   * The displayed rows are derived from `rows` and the active page.
   */
  const { count: renderedRowCount, sentinelRef } = useIncrementalRender({
    total: rows.length,
    pageSize: INFINITE_SCROLLED_PAGE_SIZE,
    lookahead: DESIRED_ROWS_LOOKAHEAD,
    enabled: !showPagination,
  });

  // Page management when using a paginated table. The page is remembered together with the rows
  // it was chosen for, so new results start again from the first page.
  const [pageSelection, setPageSelection] = useState({ rows, page: 0 });
  const activePage = pageSelection.rows === rows ? pageSelection.page : 0;
  const pageCount = Math.ceil(rows.length / PAGINATED_PAGE_SIZE);
  const startRow = activePage * PAGINATED_PAGE_SIZE;
  const endRow = Math.min(rows.length, startRow + PAGINATED_PAGE_SIZE);
  const displayedRows = rows.slice(startRow, endRow);
  const goToPage = (pageNumber: number) => {
    setPageSelection({ rows, page: pageNumber });
  };

  return (
    <div className="explore-table-container">
      {showPagination ? (
        <Pagination
          pageCount={pageCount}
          activePage={activePage}
          goToPage={goToPage}
          startItem={startRow + 1}
          endItem={endRow}
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
                  key={row._id ?? `row-${index}`}
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
          startItem={startRow + 1}
          endItem={endRow}
          totalItems={hits}
          sampleSize={sampleSize}
        />
      ) : null}
    </div>
  );
};

export const DataTable = React.memo(DataTableUI);
