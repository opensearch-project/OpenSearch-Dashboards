/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IInterpreterRenderHandlers } from 'src/plugins/expressions';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { EuiTitle, EuiFlexItem } from '@elastic/eui';
import dompurify from 'dompurify';
import { orderBy } from 'lodash';
import { i18n } from '@osd/i18n';
import { FormattedTableContext } from '../table_vis_response_handler';
import { TableVisConfig, ColumnSort } from '../types';
import { TableUiState } from '../utils';
import { usePagination } from '../utils';
import { TableVisControl } from './table_vis_control';

// Constants for dynamic sizing
const MIN_COLUMN_WIDTH = 80;
const COLUMN_BUFFER = 32;
const HEADER_BUTTON_SPACE = 64;

interface DynamicTableProps {
  title?: string;
  table: FormattedTableContext;
  visConfig: TableVisConfig;
  event: IInterpreterRenderHandlers['event'];
  uiState: TableUiState;
}

const createMeasuringElement = (): HTMLDivElement => {
  const measuringDiv = document.createElement('div');
  measuringDiv.style.position = 'absolute';
  measuringDiv.style.visibility = 'hidden';
  measuringDiv.style.whiteSpace = 'normal';
  measuringDiv.style.wordBreak = 'break-word';
  measuringDiv.style.width = 'auto';
  measuringDiv.style.height = 'auto';
  measuringDiv.style.fontSize = '14px';
  document.body.appendChild(measuringDiv);
  return measuringDiv;
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
  const [hoveredCell, setHoveredCell] = useState<{ rowIndex: number; colIndex: number } | null>(
    null
  );
  const pagination = usePagination(visConfig, rows.length) || {
    pageIndex: 0,
    pageSize: rows.length,
    totalPages: 1,
  };

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

  useEffect(() => {
    if (!tableRef.current) return;

    const measuringDiv = createMeasuringElement();
    const tableElement = tableRef.current;
    const tableContainer = tableElement.closest('.table-vis-container');
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

        return maxContentWidth + COLUMN_BUFFER;
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

    // Clean up measuring div
    document.body.removeChild(measuringDiv);
  }, [formattedColumns, rows]);

  // Filter bucket function
  const filterBucket = (rowIndex: number, columnIndex: number, negate: boolean) => {
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
            row: rowIndex,
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
  };

  const handleColumnResize = (columnIndex: number, width: number) => {
    setWidth({ colIndex: columnIndex, width });
  };

  // Footer total calculation
  const footerTotalValue = (columnId: string) => {
    if (!visConfig.showTotal) return null;
    const column = formattedColumns.find((col) => col.id === columnId);
    return column?.formattedTotal || null;
  };

  // Paginated rows
  const paginatedRows =
    pagination.pageIndex === 0
      ? sortedRows
      : sortedRows.slice(
          pagination.pageIndex * pagination.pageSize,
          (pagination.pageIndex + 1) * pagination.pageSize
        );

  return (
    <EuiFlexItem>
      {title && (
        <EuiTitle size="xs" className="eui-textCenter">
          <h3>{title}</h3>
        </EuiTitle>
      )}
      <div className="table-vis-container">
        <TableVisControl filename={visConfig.title} rows={sortedRows} columns={formattedColumns} />
        <table
          ref={tableRef}
          style={{
            width: '100%',
            tableLayout: 'fixed',
            borderCollapse: 'separate',
            borderSpacing: '0',
          }}
        >
          <thead>
            <tr>
              {formattedColumns.map((col, index) => (
                <th
                  key={col.id}
                  style={{
                    width: `${columnWidths[index] || 'auto'}px`,
                    cursor: 'pointer',
                    padding: '8px',
                    borderBottom: '1px solid #d3d3d3',
                  }}
                  onClick={() => handleSort(index)}
                  onMouseDown={(e) => {
                    const initialWidth = columnWidths[index];
                    const startX = e.clientX;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                      const delta = moveEvent.clientX - startX;
                      const newWidth = Math.max(initialWidth + delta, MIN_COLUMN_WIDTH);
                      handleColumnResize(index, newWidth);
                    };

                    const onMouseUp = () => {
                      document.removeEventListener('mousemove', onMouseMove);
                      document.removeEventListener('mouseup', onMouseUp);
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                  }}
                >
                  {col.title}
                </th>
              ))}
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
                          width: `${columnWidths[colIndex] || 'auto'}px`,
                          padding: '8px',
                          verticalAlign: 'top',
                          wordBreak: 'break-word',
                          position: 'relative',
                        }}
                      >
                        {/* Cell content */}
                        <div
                          // eslint-disable-next-line react/no-danger
                          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                          onMouseEnter={() => {
                            if (col.filterable) {
                              setHoveredCell({ rowIndex, colIndex });
                            }
                          }}
                          onMouseLeave={() => {
                            setHoveredCell(null);
                          }}
                        />

                        {/* Filter buttons */}
                        {col.filterable &&
                          hoveredCell?.rowIndex === rowIndex &&
                          hoveredCell?.colIndex === colIndex && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                display: 'flex',
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                border: '1px solid #d3d3d3',
                                borderRadius: '4px',
                                padding: '2px',
                              }}
                            >
                              <button
                                onClick={() => filterBucket(rowIndex, colIndex, false)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  marginRight: '4px',
                                  padding: 0,
                                  color: '#0077cc',
                                  fontSize: '14px',
                                }}
                                title={i18n.translate(
                                  'visTypeTable.tableVisFilter.filterForValue',
                                  {
                                    defaultMessage: 'Filter for value',
                                  }
                                )}
                              >
                                <span role="img" aria-label="Filter for value">
                                  ➕
                                </span>
                              </button>
                              <button
                                onClick={() => filterBucket(rowIndex, colIndex, true)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                  color: '#cc0000',
                                  fontSize: '14px',
                                }}
                                title={i18n.translate(
                                  'visTypeTable.tableVisFilter.filterOutValue',
                                  {
                                    defaultMessage: 'Filter out value',
                                  }
                                )}
                              >
                                <span role="img" aria-label="Filter out value">
                                  ➖
                                </span>
                              </button>
                            </div>
                          )}
                      </td>
                    );
                  })}
                </tr>
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
      </div>
    </EuiFlexItem>
  );
};
