/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import classNames from 'classnames';
import { flexRender, Table } from '@tanstack/react-table';
import './results_table_head.scss';
import { getColumnWidth } from '../utils/css';

export interface ResultsTableHeadProps {
  table: Table<{ [p: string]: any }>;
}

export const ExploreResultsTableHead = ({ table }: ResultsTableHeadProps) => {
  const tableState = table.getState();
  const resizingColumnName = tableState.columnSizingInfo.isResizingColumn;

  return (
    <thead className="exploreResultsTableHead">
      <tr className="exploreResultsTableHead__tr">
        {table.getFlatHeaders().map((header) => {
          const columnIsResizing = header.column.getIsResizing();
          const resizeHandler = header.getResizeHandler();
          const columnId = header.column.id;

          return (
            <th
              className={classNames(
                'exploreResultsTableHead__th',
                `exploreResultsTableHead__th--${columnId}`,
                {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  'exploreResultsTableHead__th--disableHover':
                    !!resizingColumnName && resizingColumnName !== columnId,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  'exploreResultsTableHead__th--showBorder': resizingColumnName === columnId,
                }
              )}
              key={header.id}
              style={{
                width: getColumnWidth(columnId),
              }}
            >
              <div className="exploreResultsTableHead__headerWrapper">
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </div>
              {header.column.getCanResize() && (
                <div
                  onDoubleClick={() => header.column.resetSize()}
                  onMouseDown={resizeHandler}
                  onTouchStart={resizeHandler}
                  className={classNames('exploreResultsTableHead__resizer', {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'exploreResultsTableHead__resizer--resizing': columnIsResizing,
                  })}
                  style={{
                    transform: columnIsResizing
                      ? `translateX(${tableState.columnSizingInfo.deltaOffset ?? 0}px)`
                      : '',
                  }}
                />
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
};
