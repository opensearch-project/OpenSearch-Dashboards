/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable react-hooks/exhaustive-deps */

import { EuiDataGridColumn } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './span_detail_table.scss';
import { RenderCustomDataGrid } from '../../utils/custom_datagrid';
import { isSpanError } from '../ppl_resolve_helpers';
import { ParsedHit, Span, SpanTableProps } from './types';
import { SpanCell } from './span_cell';
import { parseHits } from './utils';

const getListColumns = (): EuiDataGridColumn[] => {
  return [
    {
      id: 'serviceName',
      display: i18n.translate('explore.spanDetailTable.column.service', {
        defaultMessage: 'Service',
      }),
    },
    {
      id: 'name',
      display: i18n.translate('explore.spanDetailTable.column.operation', {
        defaultMessage: 'Operation',
      }),
    },
    {
      id: 'spanId',
      display: i18n.translate('explore.spanDetailTable.column.spanId', {
        defaultMessage: 'Span Id',
      }),
    },
    {
      id: 'parentSpanId',
      display: i18n.translate('explore.spanDetailTable.column.parentSpanId', {
        defaultMessage: 'Parent span Id',
      }),
    },
    {
      id: 'traceId',
      display: i18n.translate('explore.spanDetailTable.column.traceId', {
        defaultMessage: 'Trace Id',
      }),
    },
    {
      id: 'traceGroup',
      display: i18n.translate('explore.spanDetailTable.column.traceGroup', {
        defaultMessage: 'Trace group',
      }),
    },
    {
      id: 'status.code',
      display: i18n.translate('explore.spanDetailTable.column.errors', {
        defaultMessage: 'Errors',
      }),
      initialWidth: 80,
    },
    {
      id: 'durationInNanos',
      display: i18n.translate('explore.spanDetailTable.column.duration', {
        defaultMessage: 'Duration',
      }),
      initialWidth: 100,
    },
    {
      id: 'startTime',
      display: i18n.translate('explore.spanDetailTable.column.startTime', {
        defaultMessage: 'Start time',
      }),
    },
    {
      id: 'endTime',
      display: i18n.translate('explore.spanDetailTable.column.endTime', {
        defaultMessage: 'End time',
      }),
    },
  ];
};

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

      // Apply filters passed as a prop.
      if (props.filters.length > 0) {
        spans = spans.filter((span: ParsedHit) => {
          return props.filters.every(({ field, value }) => {
            if (field === 'isError' && value === true) {
              return isSpanError(span);
            }
            return span[field] === value;
          });
        });
      }

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

  const columns = useMemo(() => getListColumns(), []);
  const renderCellValue = useCallback(
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
      getListColumns()
        .filter(({ id }) => !props.hiddenColumns.includes(id))
        .map(({ id }) => id),
    []
  );

  return RenderCustomDataGrid({
    columns,
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
