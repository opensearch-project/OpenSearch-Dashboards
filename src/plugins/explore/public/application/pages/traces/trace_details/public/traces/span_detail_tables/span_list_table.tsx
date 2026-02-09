/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './span_detail_table.scss';
import { RenderCustomDataGrid } from '../../utils/custom_datagrid';
import { Span, SpanTableProps } from './types';
import { SpanCell } from './span_cell';
import { parseHits, applySpanFilters } from './utils';
import { getSpanListTableColumns } from './span_table_columns';

export const SpanListTable: React.FC<SpanTableProps> = (props) => {
  const [tableParams, setTableParams] = useState({
    size: 10,
    page: 0,
    sortingColumns: [] as Array<{
      id: string;
      direction: 'asc' | 'desc';
    }>,
  });
  const [items, setItems] = useState<Span[]>([]);
  const [total, setTotal] = useState(0);
  const [isSpansTableDataLoading, setIsSpansTableDataLoading] = useState(false);

  useEffect(() => {
    if (props.setTotal) props.setTotal(total);
  }, [total]);

  useEffect(() => {
    if (!props.payloadData) {
      return;
    }
    try {
      let spans = parseHits(props.payloadData);
      spans = applySpanFilters(spans, props.filters);

      if (tableParams.sortingColumns.length > 0) {
        spans = applySorting(spans);
      }

      const start = tableParams.page * tableParams.size;
      const end = start + tableParams.size;
      const pageSpans = spans.slice(start, end);

      setItems(pageSpans);
      setTotal(spans.length);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing payloadData in SpanDetailTable:', error);
    } finally {
      setIsSpansTableDataLoading(false);
    }
  }, [props.payloadData, props.DSL, props.filters, tableParams]);

  const applySorting = (spans: Span[]) => {
    return spans.sort((a, b) => {
      for (const { id, direction } of tableParams.sortingColumns) {
        const aValue = a[id];
        const bValue = b[id];

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const onSort = (sortingColumns: Array<{ id: string; direction: 'asc' | 'desc' }>) => {
    setTableParams((prev) => ({ ...prev, sortingColumns }));
  };

  const onChangePage = (page: number) => {
    setTableParams((prev) => ({ ...prev, page }));
  };

  const onChangeItemsPerPage = (size: number) => {
    setTableParams((prev) => ({ ...prev, size, page: 0 }));
  };

  const columns = useMemo(() => getSpanListTableColumns(), []);
  const renderCellValue = useCallback(
    // @ts-expect-error TS7031 TODO(ts-error): fixme
    ({ rowIndex, columnId, disableInteractions, setCellProps }) => (
      <SpanCell
        rowIndex={rowIndex}
        columnId={columnId}
        items={items}
        tableParams={tableParams}
        disableInteractions={disableInteractions}
        props={props}
        setCellProps={setCellProps}
      />
    ),
    [items, props.selectedSpanId]
  );

  const visibleColumns = useMemo(
    () =>
      getSpanListTableColumns()
        .filter(({ id }) => !props.hiddenColumns?.includes(id))
        .map(({ id }) => id),
    [props.hiddenColumns]
  );

  return RenderCustomDataGrid({
    columns,
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    renderCellValue,
    rowCount: total,
    sorting: { columns: tableParams.sortingColumns, onSort },
    pagination: {
      pageIndex: tableParams.page,
      pageSize: tableParams.size,
      pageSizeOptions: [10, 50, 100],
      onChangePage,
      onChangeItemsPerPage,
    },
    visibleColumns,
    availableWidth: props.availableWidth,
    isTableDataLoading: isSpansTableDataLoading,
  });
};
