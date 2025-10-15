/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { getCoreRowModel, getFilteredRowModel, useReactTable } from '@tanstack/react-table';
import { useRowsData, useColumns } from './hooks';
import { ExploreResultsTableBody, MemoizedResultsTableBody } from './body';
import { ExploreResultsTableHead } from './head';
import { getColumnSizeVariableName } from './utils/css';
import './results_table.scss';

export interface ExploreResultsTableProps {
  parentContainerRef: RefObject<HTMLDivElement>;
}

export const ExploreResultsTable = ({ parentContainerRef }: ExploreResultsTableProps) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowsData = useRowsData();
  const { columns, columnVisibility, columnOrder } = useColumns();
  const [containerHeight, setContainerHeight] = useState<number>(1000);

  useEffect(() => {
    if (parentContainerRef.current) {
      setContainerHeight(parentContainerRef.current.getBoundingClientRect().height);
    }
  }, [parentContainerRef]);

  const table = useReactTable({
    data: rowsData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnVisibility,
      columnOrder,
    },
    columnResizeMode: 'onEnd',
    columnResizeDirection: 'ltr',
    defaultColumn: {
      minSize: 50,
    },
  });

  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: number } = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      colSizes[getColumnSizeVariableName(header.column.id)] = header.column.getSize();
    }
    return colSizes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().columnSizingInfo, table.getState().columnSizing, columnVisibility]);

  return (
    <div
      ref={tableContainerRef}
      className="exploreResultsTable__container"
      style={{ ...columnSizeVars, height: `${containerHeight}px` }}
    >
      <table className="exploreResultsTable">
        <ExploreResultsTableHead table={table} />
        {table.getState().columnSizingInfo.isResizingColumn ? (
          <MemoizedResultsTableBody table={table} tableContainerRef={tableContainerRef} />
        ) : (
          <ExploreResultsTableBody table={table} tableContainerRef={tableContainerRef} />
        )}
      </table>
    </div>
  );
};
