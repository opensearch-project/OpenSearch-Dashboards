/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable react-hooks/exhaustive-deps */

import { EuiButtonEmpty, EuiDataGridColumn, EuiIcon, EuiLink, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './span_detail_table.scss';
import { RenderCustomDataGrid } from '../utils/custom_datagrid';
import { nanoToMilliSec, round } from '../utils/helper_functions';
import { TRACE_ANALYTICS_DATE_FORMAT } from '../utils/shared_const';

export interface ParsedHit extends Span {
  sort?: any[];
}
export const parseHits = (payloadData: string): ParsedHit[] => {
  try {
    const parsed = JSON.parse(payloadData);
    let hits: ParsedHit[] = [];

    if (parsed.hits && Array.isArray(parsed.hits.hits)) {
      hits = parsed.hits.hits;
    } else if (Array.isArray(parsed)) {
      hits = parsed;
    }

    return hits;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing payloadData:', error);
    return [];
  }
};

interface SpanDetailTableProps {
  hiddenColumns: string[];
  openFlyout: (spanId: string) => void;
  DSL?: any;
  setTotal?: (total: number) => void;
  availableWidth?: number;
  payloadData: string;
  filters: Array<{
    field: string;
    value: any;
  }>;
}

interface Span {
  spanId: string;
  parentSpanId?: string;
  children: Span[];
  [key: string]: any;
}

export interface SpanSearchParams {
  from: number;
  size: number;
  sortingColumns: Array<{
    [id: string]: 'asc' | 'desc';
  }>;
}

const getColumns = (): EuiDataGridColumn[] => [
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
    id: 'durationInNanos',
    display: i18n.translate('explore.spanDetailTable.column.duration', {
      defaultMessage: 'Duration',
    }),
    initialWidth: 100,
  },
  {
    id: 'status.code',
    display: i18n.translate('explore.spanDetailTable.column.errors', {
      defaultMessage: 'Errors',
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

const renderSpanCellValue = ({
  rowIndex,
  columnId,
  items,
  tableParams,
  disableInteractions,
  props,
}: {
  rowIndex: number;
  columnId: string;
  items: ParsedHit[];
  tableParams: { page: number; size: number };
  disableInteractions: boolean;
  props: SpanDetailTableProps;
}) => {
  const adjustedRowIndex = rowIndex - tableParams.page * tableParams.size;
  const item = items[adjustedRowIndex];
  if (!item) return '-';

  const value = item[columnId];
  switch (columnId) {
    case 'status.code':
      return value === 2 ? (
        <EuiText color="danger" size="s">
          {i18n.translate('explore.spanDetailTable.errors.yes', {
            defaultMessage: 'Yes',
          })}
        </EuiText>
      ) : (
        i18n.translate('explore.spanDetailTable.errors.no', {
          defaultMessage: 'No',
        })
      );
    case 'spanId':
      return disableInteractions ? (
        <span>{value}</span>
      ) : (
        <EuiLink data-test-subj="spanId-link" onClick={() => props.openFlyout(value)}>
          {value}
        </EuiLink>
      );
    case 'durationInNanos':
      return `${round(nanoToMilliSec(Math.max(0, value)), 2)} ms`;
    case 'startTime':
      return moment(value).format(TRACE_ANALYTICS_DATE_FORMAT);
    case 'endTime':
      return moment(value).format(TRACE_ANALYTICS_DATE_FORMAT);

    default:
      return value || '-';
  }
};

export function SpanDetailTable(props: SpanDetailTableProps) {
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
      const hitsArray = parseHits(props.payloadData);

      let spans = hitsArray;

      // Apply filters passed as a prop.
      if (props.filters.length > 0) {
        spans = spans.filter((span: ParsedHit) => {
          return props.filters.every(({ field, value }) => {
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

  const columns = useMemo(() => getColumns(), []);
  const renderCellValue = useCallback(
    ({ rowIndex, columnId, disableInteractions }) =>
      renderSpanCellValue({
        rowIndex,
        columnId,
        items,
        tableParams,
        disableInteractions,
        props,
      }),
    [items]
  );

  const visibleColumns = useMemo(
    () =>
      getColumns()
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
}

export function SpanDetailTableHierarchy(props: SpanDetailTableProps) {
  const { hiddenColumns, availableWidth, openFlyout } = props;
  const [items, setItems] = useState<Span[]>([]);
  const [_total, setTotal] = useState(0);
  const [expandedRows, setExpandedRows] = useState(new Set<string>());
  const [isSpansTableDataLoading, setIsSpansTableDataLoading] = useState(false);

  useEffect(() => {
    if (!props.payloadData) return;
    try {
      const hitsArray = parseHits(props.payloadData);

      // Use hits directly since they're already flattened
      let spans = hitsArray;

      if (props.filters.length > 0) {
        spans = spans.filter((span: any) => {
          return props.filters.every(
            ({ field, value }: { field: string; value: any }) => span[field] === value
          );
        });
      }

      const hierarchy = buildHierarchy(spans);
      setItems(hierarchy);
      setTotal(hierarchy.length);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing payloadData in SpanDetailTableHierarchy:', error);
    } finally {
      setIsSpansTableDataLoading(false);
    }
  }, [props.payloadData, props.DSL, props.filters]);

  type SpanMap = Record<string, Span>;

  const addRootSpan = (
    spanId: string,
    spanMap: SpanMap,
    rootSpans: Span[],
    alreadyAddedRootSpans: Set<string>
  ) => {
    if (!alreadyAddedRootSpans.has(spanId)) {
      rootSpans.push(spanMap[spanId]);
      alreadyAddedRootSpans.add(spanId);
    }
  };

  const buildHierarchy = (spans: Span[]): Span[] => {
    const spanMap: SpanMap = {};

    spans.forEach((span) => {
      spanMap[span.spanId] = { ...span, children: [] };
    });

    const rootSpans: Span[] = [];
    const alreadyAddedRootSpans: Set<string> = new Set();

    spans.forEach((span) => {
      // Data Prepper
      if (span.parentSpanId && spanMap[span.parentSpanId]) {
        spanMap[span.parentSpanId].children.push(spanMap[span.spanId]);
      } else {
        addRootSpan(span.spanId, spanMap, rootSpans, alreadyAddedRootSpans);
      }
    });

    return rootSpans;
  };

  const flattenHierarchy = (spans: Span[], level = 0, isParentExpanded = true): Span[] => {
    return spans.flatMap((span) => {
      const isExpanded = expandedRows.has(span.spanId);
      const shouldShow = level === 0 || isParentExpanded;

      const row = shouldShow ? [{ ...span, level }] : [];
      const children = flattenHierarchy(span.children || [], level + 1, isExpanded && shouldShow);
      return [...row, ...children];
    });
  };

  const flattenedItems = useMemo(() => flattenHierarchy(items), [items, expandedRows]);

  const columns = useMemo(() => getColumns(), []);
  const visibleColumns = useMemo(
    () => columns.filter(({ id }) => !hiddenColumns.includes(id)).map(({ id }) => id),
    [columns, hiddenColumns]
  );

  const gatherAllSpanIds = (spans: Span[]): Set<string> => {
    const allSpanIds = new Set<string>();
    const gather = (spanList: Span[]) => {
      spanList.forEach((span) => {
        allSpanIds.add(span.spanId);
        if (span.children.length > 0) {
          gather(span.children);
        }
      });
    };
    gather(spans);
    return allSpanIds;
  };

  const renderCellValue = useCallback(
    ({ rowIndex, columnId, disableInteractions }) => {
      const item = flattenedItems[rowIndex];
      const value = item[columnId];

      if (columnId === 'serviceName') {
        const indentation = `${(item.level || 0) * 20}px`;
        const isExpanded = expandedRows.has(item.spanId);
        return (
          <div
            className="exploreSpanDetailTable__hierarchyCell"
            style={{ paddingLeft: indentation }}
          >
            {item.children && item.children.length > 0 ? (
              <EuiIcon
                type={isExpanded ? 'arrowDown' : 'arrowRight'}
                onClick={() => {
                  setExpandedRows((prev) => {
                    const newSet = new Set(prev);
                    if (newSet.has(item.spanId)) {
                      newSet.delete(item.spanId);
                    } else {
                      newSet.add(item.spanId);
                    }
                    return newSet;
                  });
                }}
                className="exploreSpanDetailTable__expandIcon"
                data-test-subj="treeViewExpandArrow"
              />
            ) : (
              <EuiIcon type="empty" className="exploreSpanDetailTable__hiddenIcon" />
            )}
            <span>{value || '-'}</span>
          </div>
        );
      } else if (columnId === 'spanId') {
        return disableInteractions ? (
          <span>{value}</span>
        ) : (
          <EuiLink
            onClick={() => openFlyout(item.spanId)}
            color="primary"
            data-test-subj="spanId-flyout-button"
          >
            {value}
          </EuiLink>
        );
      }

      return renderSpanCellValue({
        rowIndex,
        columnId,
        items: flattenedItems,
        tableParams: { page: 0, size: flattenedItems.length },
        disableInteractions,
        props,
      });
    },
    [flattenedItems, expandedRows, openFlyout]
  );

  const toolbarButtons = [
    <EuiButtonEmpty
      size="xs"
      onClick={() => setExpandedRows(gatherAllSpanIds(items))}
      key="expandAll"
      color="text"
      iconType="expand"
      data-test-subj="treeExpandAll"
    >
      {i18n.translate('explore.spanDetailTable.button.expandAll', {
        defaultMessage: 'Expand all',
      })}
    </EuiButtonEmpty>,
    <EuiButtonEmpty
      size="xs"
      onClick={() => setExpandedRows(new Set())}
      key="collapseAll"
      color="text"
      iconType="minimize"
      data-test-subj="treeCollapseAll"
    >
      {i18n.translate('explore.spanDetailTable.button.collapseAll', {
        defaultMessage: 'Collapse all',
      })}
    </EuiButtonEmpty>,
  ];

  return RenderCustomDataGrid({
    columns,
    renderCellValue,
    rowCount: flattenedItems.length,
    toolbarButtons,
    fullScreen: false,
    availableWidth,
    visibleColumns,
    isTableDataLoading: isSpansTableDataLoading,
  });
}
