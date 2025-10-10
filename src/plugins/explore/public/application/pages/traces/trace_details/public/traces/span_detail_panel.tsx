/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiFlexGroup, EuiFlexItem, EuiHorizontalRule, EuiPanel } from '@elastic/eui';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { ChromeStart } from 'opensearch-dashboards/public';
import './span_detail_panel.scss';
import { SpanListTable, SpanHierarchyTable } from './span_detail_tables';
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

  const spanListTable = useMemo(
    () => (
      <div className="exploreSpanDetailPanel__tableContainer">
        <SpanListTable
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

  const spanHierarchyTable = useMemo(
    () => (
      <div className="exploreSpanDetailPanel__tableContainer">
        <SpanHierarchyTable
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

  // In embedded mode, render with minimal containers
  if (props.isEmbedded) {
    return (
      <div ref={containerRef}>
        {currentView === 'span_list' ? spanListTable : spanHierarchyTable}
      </div>
    );
  }

  // In non-embedded mode, render with full container structure
  return (
    <div ref={containerRef}>
      <EuiPanel data-test-subj="span-detail-panel">
        <EuiFlexGroup direction="column" gutterSize="m">
          <EuiHorizontalRule margin="m" />
          <EuiFlexItem className="exploreSpanDetailPanel__contentContainer">
            {currentView === 'span_list' ? spanListTable : spanHierarchyTable}
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </div>
  );
}
