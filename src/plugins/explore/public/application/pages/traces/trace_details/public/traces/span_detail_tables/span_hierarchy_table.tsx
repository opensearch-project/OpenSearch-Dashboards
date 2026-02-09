/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable react-hooks/exhaustive-deps */

import { EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './span_detail_table.scss';
import { RenderCustomDataGrid } from '../../utils/custom_datagrid';
import { calculateTraceTimeRange } from '../../utils/span_timerange_utils';
import { Span, SpanTableProps } from './types';
import { HierarchySpanCell } from './hierarchy_span_cell';
import { SpanCell } from './span_cell';
import { parseHits, applySpanFilters } from './utils';
import { ServiceLegendButton } from './service_legend_button';
import { getSpanHierarchyTableColumns } from './span_table_columns';
import { SpanStatusFilter } from './span_status_filter';

export const SpanHierarchyTable: React.FC<SpanTableProps> = (props) => {
  const { availableWidth, openFlyout, colorMap, servicesInOrder = [] } = props;
  const [allSpans, setAllSpans] = useState<Span[]>([]);
  const [spans, setSpans] = useState<Span[]>([]);
  const [items, setItems] = useState<Span[]>([]);
  const [_total, setTotal] = useState(0);
  const [expandedRows, setExpandedRows] = useState(new Set<string>());
  const [isSpansTableDataLoading, setIsSpansTableDataLoading] = useState(false);

  const traceTimeRange = useMemo(() => calculateTraceTimeRange(allSpans), [allSpans]);

  useEffect(() => {
    if (!props.payloadData) return;
    try {
      const hits = parseHits(props.payloadData);
      setAllSpans(hits);
      const filteredSpans = applySpanFilters(hits, props.filters);
      setSpans(filteredSpans);

      const hierarchy = buildHierarchy(filteredSpans);
      setItems(hierarchy);
      setTotal(hierarchy.length);

      // Auto-expand all spans by default to show the complete tree structure
      const allSpanIds = new Set(filteredSpans.map((span) => span.spanId));
      setExpandedRows(allSpanIds);
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

  const buildHierarchy = (spanList: Span[]): Span[] => {
    const spanMap: SpanMap = {};

    spanList.forEach((span) => {
      spanMap[span.spanId] = { ...span, children: [] };
    });

    const rootSpans: Span[] = [];
    const alreadyAddedRootSpans: Set<string> = new Set();

    spanList.forEach((span) => {
      // Data Prepper
      if (span.parentSpanId && spanMap[span.parentSpanId]) {
        spanMap[span.parentSpanId].children.push(spanMap[span.spanId]);
      } else {
        addRootSpan(span.spanId, spanMap, rootSpans, alreadyAddedRootSpans);
      }
    });

    return rootSpans;
  };

  const flattenHierarchy = (spanList: Span[], level = 0, isParentExpanded = true): Span[] => {
    return spanList.flatMap((span) => {
      const isExpanded = expandedRows.has(span.spanId);
      const shouldShow = level === 0 || isParentExpanded;

      const row = shouldShow ? [{ ...span, level }] : [];
      const children = flattenHierarchy(span.children || [], level + 1, isExpanded && shouldShow);
      return [...row, ...children];
    });
  };

  const flattenedItems = useMemo(() => flattenHierarchy(items), [items, expandedRows]);

  const columns = useMemo(() => getSpanHierarchyTableColumns(traceTimeRange, availableWidth), [
    traceTimeRange,
    availableWidth,
  ]);
  const visibleColumns = useMemo(() => columns.map(({ id }) => id), [columns]);

  const renderCellValue = useCallback(
    // @ts-expect-error TS7031 TODO(ts-error): fixme
    ({ rowIndex, columnId, disableInteractions, setCellProps }) => {
      return columnId === 'span' ? (
        <HierarchySpanCell
          rowIndex={rowIndex}
          items={flattenedItems}
          disableInteractions={disableInteractions}
          props={props}
          setCellProps={setCellProps}
          setExpandedRows={setExpandedRows}
          expandedRows={expandedRows}
        />
      ) : (
        <SpanCell
          rowIndex={rowIndex}
          columnId={columnId}
          items={flattenedItems}
          tableParams={{ page: 0, size: flattenedItems.length }}
          disableInteractions={disableInteractions}
          props={props}
          setCellProps={setCellProps}
          traceTimeRange={traceTimeRange}
          colorMap={colorMap}
        />
      );
    },
    [flattenedItems, expandedRows, openFlyout, traceTimeRange, colorMap]
  );

  const toolbarButtons = useMemo(() => {
    return [
      <EuiButtonEmpty
        size="xs"
        onClick={() => setExpandedRows(new Set(spans.map((span) => span.spanId)))}
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
  }, [spans]);

  const secondaryToolbar = [
    <SpanStatusFilter
      spanFilters={props.filters}
      setSpanFiltersWithStorage={props.setSpanFiltersWithStorage!}
    />,
    <ServiceLegendButton
      key="serviceLegend"
      servicesInOrder={servicesInOrder}
      colorMap={colorMap || {}}
    />,
  ].filter(Boolean);

  // Temporary solution for variable table height based on window size.
  //  More complex availableHeight calculations needed for table height to not only auto-scale with number of rows,
  //  but also be constrained by available height within container or page due to other elements.
  const tableHeight = props.isFlyoutPanel ? '30vh' : '80vh';

  return (
    <div data-test-subj="span-hierarchy-table">
      {RenderCustomDataGrid({
        columns,
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        renderCellValue,
        rowCount: flattenedItems.length,
        showColumnSelector: false,
        toolbarButtons,
        secondaryToolbar,
        fullScreen: false,
        availableWidth,
        visibleColumns,
        isTableDataLoading: isSpansTableDataLoading,
        defaultHeight: tableHeight,
      })}
    </div>
  );
};
