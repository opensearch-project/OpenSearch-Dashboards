/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  EuiTitle,
  EuiFlexItem,
  EuiButtonIcon,
  EuiToolTip,
  EuiIcon,
  EuiFlexGroup,
  EuiButtonEmpty,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiPopover,
  EuiPagination,
} from '@elastic/eui';
import dompurify from 'dompurify';
import { orderBy } from 'lodash';
import { i18n } from '@osd/i18n';
import './table_vis_dynamic_table.scss';
import { FormattedTableContext } from '../table_vis_response_handler';
import { TableVisConfig, ColumnSort } from '../types';
import { TableUiState } from '../utils';
import { TableVisControl } from './table_vis_control';

// Constants for dynamic sizing
const MIN_COLUMN_WIDTH = 80;
const COLUMN_BUFFER = 32;
const HEADER_BUTTON_SPACE = 24;

// Pagination constants
const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface DynamicTableProps {
  title?: string;
  table: FormattedTableContext;
  visConfig: TableVisConfig;
  event: IInterpreterRenderHandlers['event'];
  uiState: TableUiState;
}

const createMeasuringElement = (tableElement?: HTMLTableElement): HTMLDivElement => {
  const measuringDiv = document.createElement('div');
  measuringDiv.className = 'column-width-measuring-element';

  // Copy actual table font styles for accurate measurement
  if (tableElement) {
    const cellStyles = tableElement.querySelector('tbody td');
    if (cellStyles) {
      const computedCellStyles = window.getComputedStyle(cellStyles);
      measuringDiv.style.fontSize = computedCellStyles.fontSize;
      measuringDiv.style.fontFamily = computedCellStyles.fontFamily;
      measuringDiv.style.fontWeight = computedCellStyles.fontWeight;
    }
  }

  document.body.appendChild(measuringDiv);
  return measuringDiv;
};

const TableCell = ({
  sanitizedContent,
  filterable,
  rowIndex,
  colIndex,
  filterBucket,
  columnId,
  fieldMapping,
}: {
  sanitizedContent: string;
  filterable?: boolean;
  rowIndex: number;
  colIndex: number;
  filterBucket: (rowIndex: number, columnIndex: number, negate: boolean) => void;
  columnId: string;
  fieldMapping?: any;
}) => {
  return (
    <div className="tableVisCell">
      <span
        className="tableVisCell__dataField"
        data-test-subj="tableVisCellDataField"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
      {filterable && (
        <span className="tableVisCell__filter" data-test-subj="tableVisCellFilter">
          <EuiToolTip
            content={i18n.translate('visTypeTable.tableVisFilter.filterForValue', {
              defaultMessage: 'Filter for value',
            })}
          >
            <EuiButtonIcon
              size="xs"
              onClick={() => filterBucket(rowIndex, colIndex, false)}
              iconType="magnifyWithPlus"
              aria-label={i18n.translate('visTypeTable.tableVisFilter.filterForValue', {
                defaultMessage: 'Filter for value',
              })}
              data-test-subj="tableVisFilterForValue"
              className="tableVisCell__filterButton"
            />
          </EuiToolTip>
          <EuiToolTip
            content={i18n.translate('visTypeTable.tableVisFilter.filterOutValue', {
              defaultMessage: 'Filter out value',
            })}
          >
            <EuiButtonIcon
              size="xs"
              onClick={() => filterBucket(rowIndex, colIndex, true)}
              iconType="magnifyWithMinus"
              aria-label={i18n.translate('visTypeTable.tableVisFilter.filterOutValue', {
                defaultMessage: 'Filter out value',
              })}
              data-test-subj="tableVisFilterOutValue"
              className="tableVisCell__filterButton"
            />
          </EuiToolTip>
        </span>
      )}
    </div>
  );
};

const TablePaginationControls = ({
  activePage,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  activePage: number;
  pageCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const onButtonClick = () => setIsPopoverOpen((prev) => !prev);
  const closePopover = () => setIsPopoverOpen(false);

  const getIconType = (size: number) => (size === pageSize ? 'check' : 'empty');

  const button = (
    <EuiButtonEmpty
      size="s"
      color="text"
      iconType="arrowDown"
      iconSide="right"
      onClick={onButtonClick}
      data-test-subj="tableVisRowsPerPageButton"
    >
      {i18n.translate('visTypeTable.pagination.rowsPerPage', {
        defaultMessage: 'Rows per page: {pageSize}',
        values: { pageSize },
      })}
    </EuiButtonEmpty>
  );

  const items = PAGE_SIZE_OPTIONS.map((size) => (
    <EuiContextMenuItem
      key={`${size} rows`}
      icon={getIconType(size)}
      onClick={() => {
        closePopover();
        onPageSizeChange(size);
      }}
      data-test-subj={`tableVisRowsPerPage-${size}`}
    >
      {i18n.translate('visTypeTable.pagination.rowsOption', {
        defaultMessage: '{size} rows',
        values: { size },
      })}
    </EuiContextMenuItem>
  ));

  return (
    <EuiFlexGroup
      justifyContent="spaceBetween"
      alignItems="center"
      className="tableVisPagination"
      data-test-subj="tableVisPaginationControls"
    >
      <EuiFlexItem grow={false}>
        <EuiPopover
          button={button}
          isOpen={isPopoverOpen}
          closePopover={closePopover}
          panelPaddingSize="none"
          anchorPosition="upLeft"
        >
          <EuiContextMenuPanel items={items} />
        </EuiPopover>
      </EuiFlexItem>

      <EuiFlexItem grow={false}>
        <EuiPagination
          aria-label={i18n.translate('visTypeTable.pagination.ariaLabel', {
            defaultMessage: 'Table pagination',
          })}
          pageCount={pageCount}
          activePage={activePage}
          onPageClick={onPageChange}
          data-test-subj="tableVisPagination"
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export const TableVisDynamicTable: React.FC<DynamicTableProps> = ({
  title,
  table,
  visConfig,
  event,
  uiState: { sort, setSort, colWidth, setWidth },
}) => {
  const { rows, columns, formattedColumns } = table;
  const tableRef = useRef<HTMLTableElement>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);

  // Pagination state
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(visConfig.perPage || DEFAULT_PAGE_SIZE);

  // Calculate total pages
  const pageCount = Math.ceil(rows.length / pageSize);

  // Reset to first page when page size changes or data changes
  useEffect(() => {
    setPageIndex(0);
  }, [pageSize, rows.length]);

  // Ensure pageIndex is valid when pageCount changes
  useEffect(() => {
    if (pageIndex >= pageCount && pageCount > 0) {
      setPageIndex(pageCount - 1);
    }
  }, [pageCount, pageIndex]);

  // Sorting logic
  const sortedRows = useMemo(() => {
    const sortColumnId =
      sort.colIndex !== null && sort.colIndex !== undefined
        ? formattedColumns[sort.colIndex]?.id
        : undefined;

    if (sortColumnId && sort.direction) {
      return orderBy(rows, sortColumnId, sort.direction);
    } else {
      return rows;
    }
  }, [formattedColumns, rows, sort]);

  // Paginated rows
  const paginatedRows = useMemo(() => {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedRows.slice(startIndex, endIndex);
  }, [sortedRows, pageIndex, pageSize]);

  useEffect(() => {
    if (!tableRef.current) return;

    const measuringDiv = createMeasuringElement();
    const tableElement = tableRef.current;
    const tableContainer = tableElement.closest('.tableVisContainer');
    const containerWidth = tableContainer
      ? tableContainer.getBoundingClientRect().width
      : window.innerWidth * 0.7;

    const calculateColumnWidths = () => {
      const widths = formattedColumns.map((col, colIndex) => {
        const cells = tableElement.querySelectorAll(`tbody tr td:nth-child(${colIndex + 1})`);
        let maxContentWidth = 0;

        cells.forEach((cell) => {
          measuringDiv.textContent = cell.textContent || '';
          const contentWidth = measuringDiv.offsetWidth;
          maxContentWidth = Math.max(maxContentWidth, contentWidth);
        });

        measuringDiv.textContent = col.title || '';
        const headerTextWidth = measuringDiv.offsetWidth + HEADER_BUTTON_SPACE;
        const finalWidth = Math.max(maxContentWidth, headerTextWidth) + COLUMN_BUFFER;

        return finalWidth;
      });

      const totalWidth = widths.reduce((a, b) => a + b, 0);

      // Proportional scaling if total width exceeds container
      if (totalWidth > containerWidth) {
        const scaleFactor = containerWidth / totalWidth;
        return widths.map((width) => Math.max(width * scaleFactor, MIN_COLUMN_WIDTH));
      }

      return widths;
    };

    const newWidths = calculateColumnWidths();
    setColumnWidths(newWidths);

    // Apply header truncation after widths are calculated
    requestAnimationFrame(() => {
      const headerCells = tableElement.querySelectorAll('thead th');
      headerCells.forEach((th, index) => {
        const headerTextElement = th.querySelector('.header-text');
        if (headerTextElement && newWidths[index]) {
          const headerElement = headerTextElement as HTMLElement;
          const columnWidth = newWidths[index];
          // Reserve space for sort icon and padding
          const availableHeaderWidth = columnWidth - HEADER_BUTTON_SPACE;
          measuringDiv.textContent = headerElement.textContent || '';
          const headerTextWidth = measuringDiv.offsetWidth;

          if (headerTextWidth > availableHeaderWidth * 1.5) {
            // Apply truncation styles
            headerElement.style.maxWidth = `${availableHeaderWidth}px`;
            headerElement.style.overflow = 'hidden';
            headerElement.style.textOverflow = 'ellipsis';
            headerElement.style.whiteSpace = 'nowrap';
            headerElement.style.display = 'inline-block';
          } else {
            // Header fits, clear any truncation styles
            headerElement.style.maxWidth = '';
            headerElement.style.overflow = '';
            headerElement.style.textOverflow = '';
            headerElement.style.whiteSpace = '';
            headerElement.style.display = '';
          }
        }
      });

      // Clean up measuring div after truncation is applied
      if (document.body.contains(measuringDiv)) {
        document.body.removeChild(measuringDiv);
      }
    });

    return () => {
      // Cleanup in case component unmounts before RAF executes
      if (document.body.contains(measuringDiv)) {
        document.body.removeChild(measuringDiv);
      }
    };
  }, [formattedColumns, rows, columnWidths.length]);

  // Filter bucket function
  const filterBucket = (rowIndex: number, columnIndex: number, negate: boolean) => {
    // Calculate the actual row index in the full dataset
    const actualRowIndex = pageIndex * pageSize + rowIndex;
    const formattedColumnIds = formattedColumns.map((column) => column.id);
    event({
      name: 'filterBucket',
      data: {
        data: [
          {
            table: {
              columns: columns.filter((column) => formattedColumnIds.includes(column.id)),
              rows,
            },
            row: actualRowIndex,
            column: columnIndex,
          },
        ],
        negate,
      },
    });
  };

  const handleSort = (columnIndex: number) => {
    const currentSort = sort;
    const newSort: ColumnSort =
      currentSort.colIndex === columnIndex
        ? {
            colIndex: columnIndex,
            direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
          }
        : {
            colIndex: columnIndex,
            direction: 'asc',
          };

    setSort(newSort);
    // Reset to first page when sorting changes
    setPageIndex(0);
  };

  const handleColumnResize = (columnIndex: number, width: number) => {
    setWidth({ colIndex: columnIndex, width });
  };

  const handlePageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    // Reset to first page when page size changes
    setPageIndex(0);
  };

  // Footer total calculation
  const footerTotalValue = (columnId: string) => {
    if (!visConfig.showTotal) return null;
    const column = formattedColumns.find((col) => col.id === columnId);
    return column?.formattedTotal || null;
  };

  return (
    <EuiFlexItem>
      {title && (
        <EuiTitle size="xs" className="eui-textCenter">
          <h3>{title}</h3>
        </EuiTitle>
      )}
      <div className="tableVisContainer">
        <TableVisControl filename={visConfig.title} rows={sortedRows} columns={formattedColumns} />
        <table ref={tableRef}>
          <thead>
            <tr>
              {formattedColumns.map((col, index) => {
                const headerWidth = columnWidths[index] || 'auto';

                return (
                  <th
                    key={col.id}
                    className={`tableVisHeaderField ${
                      sort.colIndex === index ? 'tableVisHeaderField-isSorted' : ''
                    }`}
                    style={{
                      width: typeof headerWidth === 'number' ? `${headerWidth}px` : headerWidth,
                    }}
                    onMouseDown={(e) => {
                      const initialWidth = columnWidths[index];
                      const startX = e.clientX;
                      let hasDragged = false;

                      const onMouseMove = (moveEvent: MouseEvent) => {
                        const delta = moveEvent.clientX - startX;
                        if (Math.abs(delta) > 5) hasDragged = true;
                        const newWidth = Math.max(initialWidth + delta, MIN_COLUMN_WIDTH);
                        handleColumnResize(index, newWidth);
                      };

                      const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                        // Only trigger sort if the user didn't drag
                        if (!hasDragged) {
                          handleSort(index);
                        }
                      };

                      document.addEventListener('mousemove', onMouseMove);
                      document.addEventListener('mouseup', onMouseUp);
                      e.preventDefault(); // Prevent text selection during drag
                    }}
                  >
                    <span className="tableVisHeaderField__content">
                      <EuiToolTip content={col.title} position="top">
                        <span className="header-text">{col.title}</span>
                      </EuiToolTip>
                      <EuiIcon
                        type={
                          sort.colIndex === index && sort.direction
                            ? sort.direction === 'asc'
                              ? 'sortUp'
                              : 'sortDown'
                            : 'sortDown'
                        }
                        className="tableVisHeaderField__sortIcon"
                      />
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                <tr>
                  {formattedColumns.map((col, colIndex) => {
                    const rawContent = row[col.id];
                    const formattedContent = col.formatter.convert(rawContent, 'html');
                    const sanitizedContent = dompurify.sanitize(formattedContent);

                    return (
                      <td
                        key={col.id}
                        style={{
                          width:
                            typeof columnWidths[colIndex] === 'number'
                              ? `${columnWidths[colIndex]}px`
                              : 'auto',
                          padding: '8px',
                          verticalAlign: 'top',
                          wordBreak: 'break-word',
                        }}
                      >
                        <TableCell
                          sanitizedContent={sanitizedContent}
                          filterable={col.filterable}
                          rowIndex={rowIndex}
                          colIndex={colIndex}
                          filterBucket={filterBucket}
                          columnId={col.id}
                        />
                      </td>
                    );
                  })}
                </tr>
                {rowIndex < paginatedRows.length - 1 && (
                  <tr>
                    <td
                      colSpan={formattedColumns.length}
                      style={{
                        borderBottom: '1px solid #e0e0e0',
                        height: '1px',
                        padding: 0,
                      }}
                    />
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          {visConfig.showTotal && (
            <tfoot>
              <tr>
                {formattedColumns.map((col) => (
                  <td key={col.id}>{footerTotalValue(col.id)}</td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>

        {rows.length > 0 && (
          <TablePaginationControls
            activePage={pageIndex}
            pageCount={pageCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </EuiFlexItem>
  );
};
