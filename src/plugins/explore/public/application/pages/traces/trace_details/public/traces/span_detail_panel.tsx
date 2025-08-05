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
import { TracePPLService } from '../../server/ppl_request_trace';
import { SpanDetailTable, SpanDetailTableHierarchy } from './span_detail_table';
import { GanttChart } from '../gantt_chart_vega/gantt_chart_vega';

export interface Span {
  traceId: string;
  spanId: string;
  traceState: string;
  parentSpanId: string;
  name: string;
  kind: string;
  startTime: string;
  endTime: string;
  durationInNanos: number;
  serviceName: string;
  events: any[];
  links: any[];
  droppedAttributesCount: number;
  droppedEventsCount: number;
  droppedLinksCount: number;
  traceGroup: string;
  traceGroupFields: {
    endTime: string;
    durationInNanos: number;
    statusCode: number;
  };
  status: {
    code: number;
  };
  instrumentationLibrary: {
    name: string;
    version: string;
  };
}

export interface TraceFilter {
  field: string;
  value: any;
}

export function SpanDetailPanel(props: {
  chrome: ChromeStart;
  spanFilters: TraceFilter[];
  setSpanFiltersWithStorage: (newFilters: TraceFilter[]) => void;
  payloadData: string;
  isGanttChartLoading?: boolean;
  dataSourceMDSId: string;
  dataSourceMDSLabel: string | undefined;
  traceId?: string;
  pplService?: TracePPLService;
  indexPattern?: string;
  colorMap?: Record<string, string>;
  onSpanSelect?: (spanId: string) => void;
  selectedSpanId?: string;
  activeView?: string;
}) {
  const {
    chrome,
    spanFilters,
    setSpanFiltersWithStorage,
    payloadData,
    onSpanSelect,
    dataSourceMDSId,
    colorMap,
  } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState<number>(window.innerWidth);
  const isLocked = useObservable(chrome.getIsNavDrawerLocked$());

  const updateAvailableWidth = useCallback(() => {
    if (containerRef.current) {
      setAvailableWidth(containerRef.current.getBoundingClientRect().width);
    } else {
      // Account for the resizable container taking ~70% of the page
      const pageWidth = window.innerWidth;
      const navDrawerWidth = isLocked ? 390 : 200;
      const resizableContainerWidth = (pageWidth - navDrawerWidth) * 0.7;
      setAvailableWidth(resizableContainerWidth);
    }
  }, [isLocked]);

  useEffect(() => {
    window.addEventListener('resize', updateAvailableWidth);
    updateAvailableWidth();

    return () => {
      window.removeEventListener('resize', updateAvailableWidth);
    };
  }, [updateAvailableWidth]);

  const addSpanFilter = useCallback(
    (field: string, value: any) => {
      const newFilters = [...spanFilters];
      const index = newFilters.findIndex(({ field: filterField }) => field === filterField);
      if (index === -1) {
        newFilters.push({ field, value });
      } else {
        newFilters.splice(index, 1, { field, value });
      }
      setSpanFiltersWithStorage(newFilters);
    },
    [spanFilters, setSpanFiltersWithStorage]
  );

  const removeSpanFilter = useCallback(
    (field: string) => {
      const newFilters = [...spanFilters];
      const index = newFilters.findIndex(({ field: filterField }) => field === filterField);
      if (index !== -1) {
        newFilters.splice(index, 1);
        setSpanFiltersWithStorage(newFilters);
      }
    },
    [spanFilters, setSpanFiltersWithStorage]
  );

  // Use activeView prop or default to timeline
  const currentView = props.activeView || 'timeline';

  const spanDetailTable = useMemo(
    () => (
      <div className="exploreSpanDetailPanel__tableContainer">
        <SpanDetailTable
          hiddenColumns={['traceId', 'traceGroup']}
          openFlyout={(spanId: string) => {
            if (onSpanSelect) {
              onSpanSelect(spanId);
            }
          }}
          dataSourceMDSId={dataSourceMDSId}
          availableWidth={availableWidth}
          payloadData={payloadData}
          filters={spanFilters}
        />
      </div>
    ),
    [onSpanSelect, payloadData, spanFilters, availableWidth, dataSourceMDSId]
  );

  const spanDetailTableHierarchy = useMemo(
    () => (
      <div className="exploreSpanDetailPanel__tableContainer">
        <SpanDetailTableHierarchy
          hiddenColumns={['traceId', 'traceGroup']}
          openFlyout={(spanId: string) => {
            if (onSpanSelect) {
              onSpanSelect(spanId);
            }
          }}
          dataSourceMDSId={dataSourceMDSId}
          availableWidth={availableWidth}
          payloadData={payloadData}
          filters={spanFilters}
        />
      </div>
    ),
    [onSpanSelect, payloadData, spanFilters, availableWidth, dataSourceMDSId]
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
    const maxHeight = 600;

    return Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
  };

  const ganttChart = useMemo(
    () => (
      <div className="exploreSpanDetailPanel__ganttContainer">
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
        />
      </div>
    ),
    [parsedData, colorMap, onSpanSelect, props.selectedSpanId]
  );

  return (
    <>
      <EuiPanel data-test-subj="span-gantt-chart-panel">
        <EuiFlexGroup direction="column" gutterSize="m">
          {props.isGanttChartLoading ? (
            <div className="exploreCenterLoadingDiv">
              <EuiLoadingChart size="l" />
            </div>
          ) : (
            <>
              <EuiHorizontalRule margin="m" />

              <EuiFlexItem className="exploreSpanDetailPanel__contentContainer">
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
    </>
  );
}
