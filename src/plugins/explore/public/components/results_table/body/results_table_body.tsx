/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, RefObject, useCallback } from 'react';
import { flexRender, Row, Table } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { selectTabLogsExpandedRowsMap } from '../../../application/utils/state_management/selectors';
import { getColumnWidth } from '../utils/css';
import './results_table_body.scss';
import { ExploreResultsTableExpandedDocument } from './expanded_document';

export interface ResultsTableBodyProps {
  table: Table<{ [p: string]: any }>;
  tableContainerRef: RefObject<HTMLDivElement>;
}

const RESULT_ROW_HEIGHT = 32;
const DOC_ROW_HEIGHT = 200;

export const ExploreResultsTableBody = ({ table, tableContainerRef }: ResultsTableBodyProps) => {
  const expandedRowsMap = useSelector(selectTabLogsExpandedRowsMap);
  const { rows } = table.getRowModel();

  const estimateSize = useCallback(
    (i) => {
      if (i % 2 === 0) {
        return RESULT_ROW_HEIGHT;
      }

      const rowIndex = (i - 1) / 2;
      if (expandedRowsMap[rowIndex]) {
        return DOC_ROW_HEIGHT;
      }
      // 1 to account for the border-bottom that the doc row has
      return 1;
    },
    [expandedRowsMap]
  );

  const rowVirtualizer = useVirtualizer({
    // double to account for expansion
    count: rows.length * 2,
    estimateSize,
    getScrollElement: () => tableContainerRef.current,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 10,
  });
  return (
    <tbody
      className="exploreResultsTableBody"
      style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const isRegularRow = virtualRow.index % 2 === 0;
        const rowIndex = isRegularRow ? virtualRow.index / 2 : (virtualRow.index - 1) / 2;
        const row = rows[rowIndex] as Row<any>;
        const rowIsExpanded = expandedRowsMap[rowIndex] ?? false;

        return (
          <tr
            className={classNames('exploreResultsTableBody__tr', {
              ['exploreResultsTableBody__tr--row']: isRegularRow,
              ['exploreResultsTableBody__tr--doc']: !isRegularRow,
              ['exploreResultsTableBody__tr--rowIsExpanded']: isRegularRow && rowIsExpanded,
            })}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            key={`${row.id}${!isRegularRow && 'Expanded'}`}
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            {isRegularRow ? (
              row.getVisibleCells().map((cell) => {
                return (
                  <td
                    className={classNames(
                      'exploreResultsTableBody__td',
                      'exploreResultsTableBody__td--row',
                      `exploreResultsTableBody__td--row--${cell.column.id}`
                    )}
                    key={cell.id}
                    style={{
                      width: getColumnWidth(cell.column.id),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })
            ) : (
              <td
                className={classNames(
                  'exploreResultsTableBody__td',
                  'exploreResultsTableBody__td--doc'
                )}
                colSpan={row.getVisibleCells().length}
                style={{ height: `${rowIsExpanded ? DOC_ROW_HEIGHT : 0}px` }}
              >
                {rowIsExpanded && <ExploreResultsTableExpandedDocument row={row} />}
              </td>
            )}
          </tr>
        );
      })}
    </tbody>
  );
};

export const MemoizedResultsTableBody = memo(
  ExploreResultsTableBody,
  (prev, next) => prev.table.options.data === next.table.options.data
);
