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
}

// ToDo: These would need to be read from an upcoming config panel
const PAGINATED_PAGE_SIZE = 50;
const INFINITE_SCROLLED_PAGE_SIZE = 10;
// How far to queue unrendered rows ahead of time during infinite scrolling
const DESIRED_ROWS_LOOKAHEAD = 5 * INFINITE_SCROLLED_PAGE_SIZE;

// Content-First Table Width Algorithm Constants
const MIN_COLUMN_WIDTH = 80;
const MIN_LARGE_COLUMN_WIDTH = 400; // Minimum width for large columns to avoid too narrow display
const LARGE_COLUMN_THRESHOLD = 400; // Threshold to classify large content columns
const HEADER_BUTTON_SPACE = 64; // Space for action buttons
const COLUMN_BUFFER = 32; // Padding + margins to prevent overlap

// Types for column width calculation
interface ColumnData {
  element: HTMLTableCellElement;
  headerText: string;
  contentWidth: number;
  finalWidth: number;
}

// Helper function to create measuring element with dynamic styling
const createMeasuringElement = (tableElement?: HTMLTableElement): HTMLDivElement => {
  const measuringDiv = document.createElement('div');

  /*
   * Need to use inline styles instead of CSS classes to avoid inheritance issues
   *
   * - Previously tried CSS class `.column-width-measuring-element`
   * {
   *   position: absolute;
   *   visibility: hidden;
   *   white-space: nowrap;
   *   font-size: $euiFontSizeXS;
   *   @include ouiCodeFont;
   *   padding: $euiSizeXS;
   *   pointer-events: none;
   * }
   * - CSS classes can be overridden
   * - This caused ALL content to measure as a fixed width regardless of actual content:
   * - Inline styles have the highest CSS priority and cannot be overridden
   * - This ensures accurate content measurement regardless of other CSS
   */

  // Position and visibility - make element invisible but measurable
  measuringDiv.style.position = 'absolute'; // Remove from document flow
  measuringDiv.style.visibility = 'hidden'; // Invisible but still rendered (unlike display:none)
  measuringDiv.style.whiteSpace = 'nowrap'; // Prevent text wrapping to get true width

  // Font styling - start with defaults, will be overridden below
  measuringDiv.style.fontSize = '12px'; // Fallback font size
  measuringDiv.style.fontFamily = 'monospace'; // Fallback font family

  // Layout reset - prevent any inherited constraints
  measuringDiv.style.padding = '4px'; // Match table cell padding
  measuringDiv.style.border = 'none'; // No borders that could affect width
  measuringDiv.style.margin = '0'; // No margins

  measuringDiv.style.width = 'auto';
  measuringDiv.style.height = 'auto';
  measuringDiv.style.maxWidth = 'none';
  measuringDiv.style.minWidth = '0'; // Allow shrinking to actual content size
  measuringDiv.style.boxSizing = 'content-box'; // Consistent box model

  // Copy actual table font styles for accurate measurement
  if (tableElement) {
    const cellStyles = tableElement.querySelector('tbody td');
    if (cellStyles) {
      const computedCellStyles = window.getComputedStyle(cellStyles);
      // Override defaults with actual table styles for accuracy
      measuringDiv.style.fontSize = computedCellStyles.fontSize;
      measuringDiv.style.fontFamily = computedCellStyles.fontFamily;
      measuringDiv.style.fontWeight = computedCellStyles.fontWeight;
    }
  }

  document.body.appendChild(measuringDiv);

  return measuringDiv;
};

// Helper function to calculate content width for a column
const calculateColumnContentWidth = (
  headerText: string,
  columnIndex: number,
  tableElement: HTMLTableElement,
  measuringDiv: HTMLDivElement,
  calculatedWidthsRef: React.MutableRefObject<Map<string, number>>
): number => {
  // Check cache first
  if (calculatedWidthsRef.current.has(headerText)) {
    return calculatedWidthsRef.current.get(headerText)!;
  }

  // Calculate new width for this column
  const columnCells = tableElement.querySelectorAll(`tbody tr td:nth-child(${columnIndex + 2})`);
  let maxContentWidth = 0;

  // Measure each content cell to find the widest content
  columnCells.forEach((cell) => {
    const cellContent = cell.textContent?.trim() || '';
    measuringDiv.textContent = cellContent;
    const contentWidth = measuringDiv.offsetWidth;
    maxContentWidth = Math.max(maxContentWidth, contentWidth);
  });

  // Add buffer space and apply minimum width
  const contentWithBuffer = maxContentWidth + COLUMN_BUFFER;
  const finalWidth = Math.max(contentWithBuffer, MIN_COLUMN_WIDTH);

  // Cache the calculated width
  calculatedWidthsRef.current.set(headerText, finalWidth);

  return finalWidth;
};

// Helper function to classify columns as small or large
const classifyColumns = (columnData: ColumnData[]) => {
  const smallColumns: ColumnData[] = [];
  const largeColumns: ColumnData[] = [];
  let smallColumnsWidth = 0;
  let largeColumnsWidth = 0;

  columnData.forEach((col) => {
    if (col.contentWidth < LARGE_COLUMN_THRESHOLD) {
      smallColumns.push(col);
      smallColumnsWidth += col.contentWidth;
    } else {
      largeColumns.push(col);
      largeColumnsWidth += col.contentWidth;
    }
  });

  return { smallColumns, largeColumns, smallColumnsWidth, largeColumnsWidth };
};

// Helper function to distribute extra space proportionally
const distributeExtraSpace = (
  columnData: ColumnData[],
  totalContentWidth: number,
  extraSpace: number
) => {
  columnData.forEach((col) => {
    const extraForThisColumn = extraSpace * (col.contentWidth / totalContentWidth);
    col.finalWidth = col.contentWidth + extraForThisColumn;
  });
};

// Helper function to apply refined distribution for space shortage
const applyRefinedDistribution = (
  smallColumns: ColumnData[],
  largeColumns: ColumnData[],
  availableTableWidth: number,
  smallColumnsWidth: number,
  largeColumnsWidth: number
) => {
  // Small columns keep their calculated width
  smallColumns.forEach((col) => {
    col.finalWidth = col.contentWidth;
  });

  // Large columns share the remaining space proportionally
  const remainingSpace = availableTableWidth - smallColumnsWidth;

  if (largeColumns.length > 0 && remainingSpace > 0) {
    largeColumns.forEach((col) => {
      const originalWidth = col.contentWidth;
      const proportion = originalWidth / largeColumnsWidth;
      const newWidth = Math.max(remainingSpace * proportion, MIN_LARGE_COLUMN_WIDTH);
      col.finalWidth = newWidth;
    });
  } else if (largeColumns.length > 0) {
    // Not enough space even for minimum widths - set to minimum and allow overflow
    largeColumns.forEach((col) => {
      col.finalWidth = MIN_LARGE_COLUMN_WIDTH;
    });
  }
};

// Helper function to apply header truncation
const applyHeaderTruncation = (col: ColumnData, measuringDiv: HTMLDivElement) => {
  const headerTextElement = col.element.querySelector('.header-text');
  if (headerTextElement) {
    const headerElement = headerTextElement as HTMLElement;

    // Measure header text width
    measuringDiv.textContent = col.headerText;
    const headerWidth = measuringDiv.offsetWidth;
    const availableHeaderWidth = Math.round(col.finalWidth) - HEADER_BUTTON_SPACE;

    if (headerWidth > availableHeaderWidth) {
      // Apply ellipsis to header
      headerElement.style.maxWidth = availableHeaderWidth + 'px';
      headerElement.style.overflow = 'hidden';
      headerElement.style.textOverflow = 'ellipsis';
      headerElement.style.whiteSpace = 'nowrap';
    } else {
      // Header fits, remove any previous ellipsis styles
      headerElement.style.maxWidth = '';
      headerElement.style.overflow = '';
      headerElement.style.textOverflow = '';
      headerElement.style.whiteSpace = '';
    }
  }
};

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
  // Store calculated column widths to prevent recalculation when adding columns
  const calculatedWidthsRef = useRef<Map<string, number>>(new Map());

  /* In asynchronous data loading, column metadata may arrive before the corresponding data, resulting in
     layout being calculated for the new column definitions using the old data. To mitigate this issue, we
     additionally trigger a recalculation when a change is observed in the index that the data attributes
     itself to. This ensures a re-layout is performed when new data is loaded or the column definitions
     change, effectively addressing the symptoms of the race condition.
   */
  const indexOfRenderedData = rows?.[0]?._index;
  const timeFromFirstRow =
    typeof dataset?.timeFieldName === 'string' && rows?.[0]?._source?.[dataset.timeFieldName];

  useEffect(() => {
    if (!tableElement) return;

    // Get all header columns (skip first column which is expand/collapse)
    const headerCells = tableElement.querySelectorAll('thead > tr > th:not(:first-child)');

    // Check if we need to calculate new widths or can reuse existing ones
    const needsRecalculation =
      headerCells.length === 0 ||
      Array.from(headerCells).some((th) => {
        const headerText = th.textContent?.trim() || '';
        return !calculatedWidthsRef.current.has(headerText);
      });

    if (needsRecalculation) {
      // Create measuring element and calculate new column widths
      const measuringDiv = createMeasuringElement(tableElement);

      tableLayoutRequestFrameRef.current = requestAnimationFrame(() => {
        if (!tableElement) return;

        // Calculate available table width (viewport - sidebar - padding)
        const tableContainer = tableElement.closest('.explore-table-container');
        const containerWidth = tableContainer
          ? tableContainer.getBoundingClientRect().width
          : window.innerWidth * 0.7;
        const availableTableWidth = containerWidth - 40;

        // Step 1: Measure content-based width for each column
        const columnData: ColumnData[] = [];
        headerCells.forEach((th, columnIndex) => {
          const headerText = th.textContent?.trim() || '';

          const contentWidth = calculateColumnContentWidth(
            headerText,
            columnIndex,
            tableElement,
            measuringDiv,
            calculatedWidthsRef
          );

          columnData.push({
            element: th as HTMLTableCellElement,
            headerText,
            contentWidth,
            finalWidth: contentWidth,
          });
        });

        // Step 2: Apply distribution algorithm
        const totalContentWidth = columnData.reduce((sum, col) => sum + col.contentWidth, 0);

        if (totalContentWidth <= availableTableWidth) {
          // Case A: Extra space available - distribute proportionally
          const extraSpace = availableTableWidth - totalContentWidth;
          distributeExtraSpace(columnData, totalContentWidth, extraSpace);
        } else {
          // Case B: Space shortage - apply refined distribution
          const {
            smallColumns,
            largeColumns,
            smallColumnsWidth,
            largeColumnsWidth,
          } = classifyColumns(columnData);
          applyRefinedDistribution(
            smallColumns,
            largeColumns,
            availableTableWidth,
            smallColumnsWidth,
            largeColumnsWidth
          );
        }

        // Step 3: Apply final widths and header truncation
        columnData.forEach((col) => {
          const finalWidth = Math.round(col.finalWidth);

          // Apply the final width to the column
          col.element.style.width = finalWidth + 'px';
          col.element.style.minWidth = finalWidth + 'px';

          // Handle header truncation
          applyHeaderTruncation(col, measuringDiv);
        });

        // Set table to fixed layout to lock in our calculated widths
        tableElement.style.tableLayout = 'fixed';

        // Clean up measuring element
        document.body.removeChild(measuringDiv);
      });
    } else {
      // Apply cached widths directly
      tableLayoutRequestFrameRef.current = requestAnimationFrame(() => {
        if (!tableElement) return;

        headerCells.forEach((th) => {
          const headerText = th.textContent?.trim() || '';
          const cachedWidth = calculatedWidthsRef.current.get(headerText);

          if (cachedWidth) {
            // Apply the cached width
            (th as HTMLTableCellElement).style.width = cachedWidth + 'px';
            (th as HTMLTableCellElement).style.minWidth = cachedWidth + 'px';

            // Handle header truncation for cached widths
            const headerTextElement = th.querySelector('.header-text');
            if (headerTextElement) {
              const headerElement = headerTextElement as HTMLElement;
              const availableHeaderWidth = cachedWidth - HEADER_BUTTON_SPACE;

              // Ensure consistent truncation styles for cached widths
              if (headerElement.style.maxWidth) {
                headerElement.style.maxWidth = availableHeaderWidth + 'px';
              }
            }
          }
        });

        // Set table to fixed layout
        tableElement.style.tableLayout = 'fixed';
      });
    }

    return () => cancelAnimationFrame(tableLayoutRequestFrameRef.current);
  }, [columns, tableElement, indexOfRenderedData, timeFromFirstRow]);

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
      <table data-test-subj="docTable" className="explore-table table" ref={tableRef}>
        <thead>
          <TableHeader displayedColumns={columns} onRemoveColumn={onRemoveColumn} />
        </thead>
        <tbody>
          {(showPagination ? displayedRows : rows.slice(0, renderedRowCount)).map(
            (row, index: number) => {
              return (
                <TableRow
                  key={index}
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
