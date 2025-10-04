/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiLoadingChart,
  EuiPanel,
} from '@elastic/eui';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { ChromeStart } from 'opensearch-dashboards/public';
import './span_detail_panel.scss';
import { SpanDetailTable, SpanDetailTableHierarchy } from './span_detail_table';
import { GanttChart } from '../gantt_chart_vega/gantt_chart_vega';
import { GANTT_CHART_CONSTANTS } from '../gantt_chart_vega/gantt_constants';

export interface TraceFilter {
  field: string;
  value: any;
}

export function SpanDetailPanel(props: {
  chrome: ChromeStart;
  spanFilters: TraceFilter[];
  payloadData: string;
  isGanttChartLoading?: boolean;
  colorMap?: Record<string, string>;
  onSpanSelect?: (spanId: string) => void;
  selectedSpanId?: string;
  activeView?: string;
  isEmbedded?: boolean;
}) {
  const { chrome, spanFilters, payloadData, onSpanSelect, colorMap } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState<number>(
    GANTT_CHART_CONSTANTS.DEFAULT_AVAILABLE_WIDTH
  );

  // Always call useObservable, but use a default value for embedded mode
  const navDrawerLocked = useObservable(chrome.getIsNavDrawerLocked$()) || false;
  const isLocked = props.isEmbedded ? false : navDrawerLocked;

  const updateAvailableWidth = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      setAvailableWidth(
        containerWidth > 0 ? containerWidth : GANTT_CHART_CONSTANTS.DEFAULT_AVAILABLE_WIDTH
      );
    } else {
      // Account for the resizable container taking ~70% of the page
      const pageWidth = window.innerWidth;
      const navDrawerWidth = isLocked ? 390 : 200;
      const resizableContainerWidth = (pageWidth - navDrawerWidth) * 0.7;
      setAvailableWidth(resizableContainerWidth);
    }
  }, [isLocked]);

  useEffect(() => {
    if (props.isEmbedded) {
      // In embedded mode, set width once based on container size and don't listen to resize events
      if (containerRef.current) {
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        setAvailableWidth(
          containerWidth > 0 ? containerWidth : GANTT_CHART_CONSTANTS.DEFAULT_AVAILABLE_WIDTH
        );
      }
      return;
    }

    window.addEventListener('resize', updateAvailableWidth);
    updateAvailableWidth();

    return () => {
      window.removeEventListener('resize', updateAvailableWidth);
    };
  }, [updateAvailableWidth, props.isEmbedded]);

  const currentView = props.activeView || 'timeline';

  const spanDetailTable = useMemo(
    () => (
      <div className="exploreSpanDetailPanel__tableContainer">
        <SpanDetailTable
          hiddenColumns={['traceId', 'traceGroup', 'parentSpanId', 'startTime', 'endTime']}
          openFlyout={(spanId: string) => {
            if (onSpanSelect) {
              onSpanSelect(spanId);
            }
          }}
          availableWidth={availableWidth}
          payloadData={payloadData}
          filters={spanFilters}
          selectedSpanId={props.selectedSpanId}
        />
      </div>
    ),
    [onSpanSelect, payloadData, spanFilters, availableWidth, props.selectedSpanId]
  );

  const spanDetailTableHierarchy = useMemo(
    () => (
      <div className="exploreSpanDetailPanel__tableContainer">
        <SpanDetailTableHierarchy
          hiddenColumns={['traceId', 'traceGroup', 'startTime', 'endTime', 'parentSpanId']}
          openFlyout={(spanId: string) => {
            if (onSpanSelect) {
              onSpanSelect(spanId);
            }
          }}
          availableWidth={availableWidth}
          payloadData={payloadData}
          filters={spanFilters}
          selectedSpanId={props.selectedSpanId}
          colorMap={colorMap}
        />
      </div>
    ),
    [onSpanSelect, payloadData, spanFilters, availableWidth, props.selectedSpanId, colorMap]
  );

  const parsedData = useMemo(() => {
    try {
      return JSON.parse(payloadData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing payload data:', error);
      return [];
    }
  }, [payloadData]);

  // Determine if we need scrollable behavior based on span count
  const needsScrollableContainer = useMemo(() => {
    // Apply scrollable behavior for larger datasets (15+ spans)
    // This threshold ensures small datasets don't get scroll bars
    return parsedData.length >= 15;
  }, [parsedData.length]);

  const ganttChart = useMemo(() => {
    // Calculate dynamic height based on number of spans
    const calculateGanttHeight = (spanCount: number): number => {
      const rowHeight = 35;
      const baseHeight = 100;

      if (spanCount === 0) {
        return 150;
      }

      if (spanCount === 1) {
        return 120;
      }

      if (spanCount <= 3) {
        return Math.max(150, spanCount * rowHeight + baseHeight);
      }

      const calculatedHeight = spanCount * rowHeight + baseHeight;
      const minHeight = 200;

      // In embedded mode, don't limit the maximum height - let it grow to show all spans
      if (props.isEmbedded) {
        return Math.max(minHeight, calculatedHeight);
      }

      // In non-embedded mode, let the CSS container handle the max height constraint
      return Math.max(minHeight, calculatedHeight);
    };

    const chart = (
      <GanttChart
        data={parsedData}
        colorMap={colorMap || {}}
        height={calculateGanttHeight(parsedData.length)}
        onSpanClick={(spanId) => {
          if (onSpanSelect) {
            onSpanSelect(spanId);
          }
        }}
        selectedSpanId={props.selectedSpanId}
        isEmbedded={props.isEmbedded}
      />
    );

    // In embedded mode, return chart directly without extra container
    if (props.isEmbedded) {
      return chart;
    }

    // In non-embedded mode, wrap in container
    return <div className="exploreSpanDetailPanel__ganttContainer">{chart}</div>;
  }, [parsedData, colorMap, onSpanSelect, props.selectedSpanId, props.isEmbedded]);

  // In embedded mode, render with minimal containers and let GanttChart determine its own height
  if (props.isEmbedded) {
    return (
      <div ref={containerRef}>
        {props.isGanttChartLoading ? (
          <div className="exploreCenterLoadingDiv">
            <EuiLoadingChart size="l" />
          </div>
        ) : (
          ganttChart
        )}
      </div>
    );
  }

  // In non-embedded mode, render with full container structure
  return (
    <div ref={containerRef}>
      <EuiPanel data-test-subj="span-gantt-chart-panel">
        <EuiFlexGroup direction="column" gutterSize="m">
          {props.isGanttChartLoading ? (
            <div className="exploreCenterLoadingDiv">
              <EuiLoadingChart size="l" />
            </div>
          ) : (
            <>
              <EuiHorizontalRule margin="m" />

              <EuiFlexItem
                className={`exploreSpanDetailPanel__contentContainer${
                  needsScrollableContainer
                    ? ' exploreSpanDetailPanel__contentContainer--scrollable'
                    : ''
                }`}
              >
                {currentView === 'timeline'
                  ? ganttChart
                  : currentView === 'span_list'
                  ? spanDetailTable
                  : currentView === 'tree_view'
                  ? spanDetailTableHierarchy
                  : ganttChart}
              </EuiFlexItem>
            </>
          )}
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  );
}
