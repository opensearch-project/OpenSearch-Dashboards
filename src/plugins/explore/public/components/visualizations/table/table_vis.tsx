/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiDataGrid,
  EuiDataGridCellValueElementProps,
  EuiDataGridColumn,
  EuiFieldText,
  EuiIcon,
  EuiPopover,
} from '@elastic/eui';
import { VisColumn } from '../types';
import { TableChartStyleControls } from './table_vis_config';

interface TableVisProps {
  rows: Array<Record<string, any>>;
  columns: VisColumn[];
  styleOptions?: TableChartStyleControls;
}

export const TableVis = React.memo(({ rows, columns, styleOptions }: TableVisProps) => {
  const pageSize = styleOptions?.pageSize ? styleOptions.pageSize : 10;
  const [visibleColumns, setVisibleColumns] = useState(() => columns.map(({ column }) => column));
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null);

  const dataGridColumns: EuiDataGridColumn[] = useMemo(() => {
    return columns.map((col) => ({
      id: col.column,
      displayAsText: col.name,
      display: styleOptions?.showColumnFilter ? (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {col.name}
          </span>
          <EuiPopover
            button={
              <EuiIcon
                type="filter"
                onClick={(e) => {
                  e.stopPropagation();
                  setPopoverOpen(popoverOpen === col.column ? null : col.column);
                }}
                style={{ cursor: 'pointer', marginLeft: 'auto' }}
                data-test-subj={`visTableFilterIcon-${col.column}`}
              />
            }
            isOpen={popoverOpen === col.column}
            closePopover={() => setPopoverOpen(null)}
            panelPaddingSize="s"
          >
            <div style={{ width: '200px', padding: '8px' }}>
              <EuiFieldText
                placeholder={`Filter ${col.name}`}
                value={filters[col.column] || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, [col.column]: e.target.value }))}
                fullWidth
                data-test-subj={`visTableFilterInput-${col.column}`}
              />
              <EuiButtonEmpty
                size="xs"
                onClick={() =>
                  setFilters((prev) => {
                    const newFilters = { ...prev };
                    delete newFilters[col.column];
                    return newFilters;
                  })
                }
                style={{ marginTop: '8px' }}
              >
                Clear
              </EuiButtonEmpty>
            </div>
          </EuiPopover>
        </div>
      ) : (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {col.name}
        </span>
      ),
    }));
  }, [columns, styleOptions?.showColumnFilter, popoverOpen, filters]);

  const onChangePage = useCallback((pageIndex) => setPagination((p) => ({ ...p, pageIndex })), [
    setPagination,
  ]);

  const onChangeItemsPerPage = useCallback(
    (perPage) =>
      setPagination((p) => ({
        ...p,
        pageSize: perPage,
        pageIndex: 0,
      })),
    [setPagination]
  );

  const renderCellValue = useMemo(() => {
    return ({ rowIndex, columnId, setCellProps }: EuiDataGridCellValueElementProps) => {
      const alignment = styleOptions?.globalAlignment || 'auto';
      setCellProps({ style: { textAlign: alignment === 'auto' ? 'left' : alignment } });
      return rows.hasOwnProperty(rowIndex) ? rows[rowIndex][columnId] : null;
    };
  }, [rows, styleOptions?.globalAlignment]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      Object.entries(filters).every(([columnId, filterValue]) => {
        if (!filterValue) return true;
        const value = String(row[columnId]).toLowerCase();
        return value.includes(filterValue.toLowerCase());
      })
    );
  }, [rows, filters]);

  return (
    <EuiDataGrid
      aria-label="Table visualization"
      columns={dataGridColumns}
      columnVisibility={{ visibleColumns, setVisibleColumns }}
      rowCount={filteredRows.length}
      pagination={{ ...pagination, onChangePage, onChangeItemsPerPage, pageSize }}
      renderCellValue={renderCellValue}
      toolbarVisibility={{ showFullScreenSelector: false }}
      gridStyle={{ rowHover: 'highlight' }}
      leadingControlColumns={[]}
      trailingControlColumns={[]}
    />
  );
});
