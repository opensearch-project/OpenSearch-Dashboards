/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/* eslint-disable react-hooks/exhaustive-deps */

import { EuiButtonEmpty, EuiButtonIcon, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './span_detail_table.scss';
import { RenderCustomDataGrid } from '../../utils/custom_datagrid';
import { calculateTraceTimeRange, TraceTimeRange } from '../../utils/span_timerange_utils';
import { Span, SpanTableProps } from './types';
import { HierarchySpanCell } from './hierarchy_span_cell';
import { SpanCell } from './span_cell';
import { parseHits, applySpanFilters } from './utils';
import { ServiceLegendButton } from './service_legend_button';
import { getSpanHierarchyTableColumns } from './span_table_columns';

export const SpanHierarchyTable: React.FC<SpanTableProps> = (props) => {
  const { availableWidth, openFlyout, colorMap, servicesInOrder = [] } = props;
  const [allSpans, setAllSpans] = useState<Span[]>([]);
  const [spans, setSpans] = useState<Span[]>([]);
  const [items, setItems] = useState<Span[]>([]);
  const [_total, setTotal] = useState(0);
  const [expandedRows, setExpandedRows] = useState(new Set<string>());
  const [isSpansTableDataLoading, setIsSpansTableDataLoading] = useState(false);
  // Visible time window driven by the timeline brush (undefined = full range).
  const [visibleRange, setVisibleRange] = useState<TraceTimeRange | undefined>(undefined);

  const traceTimeRange = useMemo(() => calculateTraceTimeRange(allSpans), [allSpans]);

  const handleVisibleRangeChange = useCallback(
    (range: TraceTimeRange | null) => setVisibleRange(range ?? undefined),
    []
  );

  useEffect(() => {
    if (!props.payloadData) return;
    try {
      const hits = parseHits(props.payloadData);
      setAllSpans(hits);
      // New trace payload: reset any prior zoom window.
      setVisibleRange(undefined);
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

  // Keep the latest flattened rows in a ref so the expand/collapse toolbar
  // handlers can stay stable (identity-wise) yet always read current rows —
  // avoids a stale-closure no-op on the first click after a re-render.
  const flattenedItemsRef = useRef(flattenedItems);
  flattenedItemsRef.current = flattenedItems;

  const columns = useMemo(
    () =>
      getSpanHierarchyTableColumns(traceTimeRange, availableWidth, {
        visibleRange,
        brush: { spans: allSpans, colorMap, onChange: handleVisibleRangeChange },
      }),
    [traceTimeRange, availableWidth, visibleRange, allSpans, colorMap, handleVisibleRangeChange]
  );
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
          visibleRange={visibleRange}
        />
      );
    },
    [flattenedItems, expandedRows, openFlyout, traceTimeRange, colorMap, visibleRange]
  );

  // Expand the whole tree by one more level: expand every currently-visible
  // parent that isn't already expanded (reveals the next level everywhere).
  const expandOneLevel = useCallback(() => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      flattenedItemsRef.current.forEach((span) => {
        if (span.children?.length && !next.has(span.spanId)) next.add(span.spanId);
      });
      return next;
    });
  }, []);

  // Collapse the deepest currently-visible level across the whole tree. We
  // target the deepest spans that actually have a *visible* child (derived from
  // parentSpanId), so it's guaranteed to hide rows regardless of stale/cyclic
  // child refs in the data.
  const collapseOneLevel = useCallback(() => {
    setExpandedRows((prev) => {
      const rows = flattenedItemsRef.current;
      const parentsOfVisibleRows = new Set(
        rows.map((span) => span.parentSpanId).filter(Boolean) as string[]
      );
      let deepest = -1;
      rows.forEach((span) => {
        if (parentsOfVisibleRows.has(span.spanId)) deepest = Math.max(deepest, span.level ?? 0);
      });
      if (deepest < 0) return prev;
      const next = new Set(prev);
      rows.forEach((span) => {
        if ((span.level ?? 0) === deepest && parentsOfVisibleRows.has(span.spanId)) {
          next.delete(span.spanId);
        }
      });
      return next;
    });
  }, []);

  const canExpandMore = useMemo(
    () => flattenedItems.some((span) => span.children?.length && !expandedRows.has(span.spanId)),
    [flattenedItems, expandedRows]
  );
  const canCollapseMore = useMemo(
    () => flattenedItems.some((span) => (span.level ?? 0) > 0),
    [flattenedItems]
  );

  const toolbarButtons = useMemo(() => {
    const expandAllLabel = i18n.translate('explore.spanDetailTable.button.expandAll', {
      defaultMessage: 'Expand all',
    });
    const collapseAllLabel = i18n.translate('explore.spanDetailTable.button.collapseAll', {
      defaultMessage: 'Collapse all',
    });
    const expandOneLabel = i18n.translate('explore.spanDetailTable.button.expandOneLevel', {
      defaultMessage: 'Expand one level',
    });
    const collapseOneLabel = i18n.translate('explore.spanDetailTable.button.collapseOneLevel', {
      defaultMessage: 'Collapse one level',
    });
    // When disabled, explain WHY (otherwise the greyed icon reads as broken).
    const expandOneTooltip = canExpandMore
      ? expandOneLabel
      : i18n.translate('explore.spanDetailTable.button.expandOneLevelDisabled', {
          defaultMessage: 'Tree is fully expanded',
        });
    const collapseOneTooltip = canCollapseMore
      ? collapseOneLabel
      : i18n.translate('explore.spanDetailTable.button.collapseOneLevelDisabled', {
          defaultMessage: 'Tree is fully collapsed',
        });
    return [
      <EuiToolTip key="expandAll" content={expandAllLabel}>
        <EuiButtonIcon
          size="xs"
          onClick={() => setExpandedRows(new Set(spans.map((span) => span.spanId)))}
          color="text"
          display="empty"
          iconType="expand"
          aria-label={expandAllLabel}
          data-test-subj="treeExpandAll"
        />
      </EuiToolTip>,
      <EuiToolTip key="collapseAll" content={collapseAllLabel}>
        <EuiButtonIcon
          size="xs"
          onClick={() => setExpandedRows(new Set())}
          color="text"
          display="empty"
          iconType="minimize"
          aria-label={collapseAllLabel}
          data-test-subj="treeCollapseAll"
        />
      </EuiToolTip>,
      <EuiToolTip key="expandOne" content={expandOneTooltip}>
        {/* span wrapper so the tooltip still shows while the button is disabled */}
        <span>
          <EuiButtonIcon
            size="xs"
            onClick={expandOneLevel}
            color="text"
            display="empty"
            iconType="menuDown"
            isDisabled={!canExpandMore}
            aria-label={expandOneLabel}
            data-test-subj="treeExpandOneLevel"
          />
        </span>
      </EuiToolTip>,
      <EuiToolTip key="collapseOne" content={collapseOneTooltip}>
        <span>
          <EuiButtonIcon
            size="xs"
            onClick={collapseOneLevel}
            color="text"
            display="empty"
            iconType="menuUp"
            isDisabled={!canCollapseMore}
            aria-label={collapseOneLabel}
            data-test-subj="treeCollapseOneLevel"
          />
        </span>
      </EuiToolTip>,
    ];
  }, [spans, expandOneLevel, collapseOneLevel, canExpandMore, canCollapseMore]);

  // Timeline-grid controls only. Cross-tab filters (status / duration / attribute)
  // live in the trace view's filter bar, since they apply across all span tabs.
  const secondaryToolbar = [
    <EuiToolTip
      key="resetZoomTip"
      content={
        visibleRange
          ? i18n.translate('explore.spanDetailTable.resetZoom.enabledTooltip', {
              defaultMessage: 'Reset the timeline zoom to the full trace',
            })
          : i18n.translate('explore.spanDetailTable.resetZoom.disabledTooltip', {
              defaultMessage: 'Drag the timeline slider to zoom, then reset here',
            })
      }
    >
      {/* span wrapper so the tooltip still shows while the button is disabled */}
      <span>
        <EuiButtonIcon
          size="xs"
          color="text"
          display="empty"
          iconType="editorUndo"
          isDisabled={!visibleRange}
          onClick={() => setVisibleRange(undefined)}
          aria-label={i18n.translate('explore.spanDetailTable.resetZoom.label', {
            defaultMessage: 'Reset zoom',
          })}
          data-test-subj="timelineResetZoom"
        />
      </span>
    </EuiToolTip>,
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
