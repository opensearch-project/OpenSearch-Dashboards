/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiBadge,
  EuiButtonGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiLoadingChart,
  EuiPanel,
  EuiSpacer,
} from '@elastic/eui';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import useObservable from 'react-use/lib/useObservable';
import { ChromeStart } from 'opensearch-dashboards/public';
import { TracePPLService } from '../../server/ppl_request_trace';
import { SpanDetailTable, SpanDetailTableHierarchy } from './span_detail_table';
import { SpanDetailFlyout } from './span_detail_flyout';
import { PanelTitle } from '../utils/helper_functions';
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
}) {
  const { chrome } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableWidth, setAvailableWidth] = useState<number>(window.innerWidth);
  const isLocked = useObservable(chrome.getIsNavDrawerLocked$());
  const [currentSpan, setCurrentSpan] = useState('');

  const updateAvailableWidth = () => {
    if (containerRef.current) {
      setAvailableWidth(containerRef.current.getBoundingClientRect().width);
    } else {
      setAvailableWidth(window.innerWidth);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateAvailableWidth);
    updateAvailableWidth();

    return () => {
      window.removeEventListener('resize', updateAvailableWidth);
    };
  }, []);

  const addSpanFilter = (field: string, value: any) => {
    const newFilters = [...props.spanFilters];
    const index = newFilters.findIndex(({ field: filterField }) => field === filterField);
    if (index === -1) {
      newFilters.push({ field, value });
    } else {
      newFilters.splice(index, 1, { field, value });
    }
    props.setSpanFiltersWithStorage(newFilters);
  };

  // Destructure props to avoid the entire props object as a dependency
  const { spanFilters, setSpanFiltersWithStorage } = props;

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

  const renderFilters = useMemo(() => {
    return props.spanFilters.map(({ field, value }) => (
      <EuiFlexItem grow={false} key={`span-filter-badge-${field}`}>
        <EuiBadge
          iconType="cross"
          iconSide="right"
          iconOnClick={() => removeSpanFilter(field)}
          iconOnClickAriaLabel="remove current filter"
        >
          {`${field}: ${value}`}
        </EuiBadge>
      </EuiFlexItem>
    ));
  }, [props.spanFilters, removeSpanFilter]);

  const toggleOptions = [
    {
      id: 'timeline',
      label: 'Timeline',
    },
    {
      id: 'span_list',
      label: 'Span list',
    },
    {
      id: 'hierarchy_span_list',
      label: 'Tree view',
    },
  ];
  const [toggleIdSelected, setToggleIdSelected] = useState(toggleOptions[0].id);

  const spanDetailTable = useMemo(
    () => (
      <div style={{ width: 'auto' }}>
        <SpanDetailTable
          hiddenColumns={['traceId', 'traceGroup']}
          openFlyout={(spanId: string) => {
            setCurrentSpan(spanId);
          }}
          dataSourceMDSId={props.dataSourceMDSId}
          availableWidth={availableWidth - (isLocked ? 390 : 200)}
          payloadData={props.payloadData}
          filters={props.spanFilters}
        />
      </div>
    ),
    [
      setCurrentSpan,
      props.payloadData,
      props.spanFilters,
      availableWidth,
      isLocked,
      props.dataSourceMDSId,
    ]
  );

  const spanDetailTableHierarchy = useMemo(
    () => (
      <div style={{ width: 'auto' }}>
        <SpanDetailTableHierarchy
          hiddenColumns={['traceId', 'traceGroup']}
          openFlyout={(spanId: string) => {
            setCurrentSpan(spanId);
          }}
          dataSourceMDSId={props.dataSourceMDSId}
          availableWidth={availableWidth - (isLocked ? 390 : 200)}
          payloadData={props.payloadData}
          filters={props.spanFilters}
        />
      </div>
    ),
    [
      setCurrentSpan,
      props.payloadData,
      props.spanFilters,
      availableWidth,
      isLocked,
      props.dataSourceMDSId,
    ]
  );

  const parsedData = useMemo(() => {
    try {
      return JSON.parse(props.payloadData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error parsing payload data:', error);
      return [];
    }
  }, [props.payloadData]);

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

    // For larger datasets, use progressive scaling
    const calculatedHeight = spanCount * rowHeight + baseHeight;
    const minHeight = 200;
    const maxHeight = 600;

    return Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
  };

  const ganttChart = useMemo(
    () => (
      <div style={{ width: '100%' }}>
        <GanttChart
          data={parsedData}
          colorMap={props.colorMap || {}}
          height={calculateGanttHeight(parsedData.length)}
          onSpanClick={(spanId) => setCurrentSpan(spanId)}
        />
      </div>
    ),
    [parsedData, props.colorMap, setCurrentSpan]
  );

  return (
    <>
      <EuiPanel data-test-subj="span-gantt-chart-panel">
        <EuiFlexGroup direction="column" gutterSize="m">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup>
              <EuiFlexItem>
                <PanelTitle title="Spans" totalItems={parsedData.length} />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFlexGroup justifyContent="flexEnd" alignItems="center" gutterSize="s">
                  <EuiFlexItem grow={false}>
                    <EuiButtonGroup
                      isDisabled={props.isGanttChartLoading}
                      legend="Select view of spans"
                      options={toggleOptions}
                      idSelected={toggleIdSelected}
                      onChange={(id) => setToggleIdSelected(id)}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          {props.isGanttChartLoading ? (
            <div className="center-loading-div">
              <EuiLoadingChart size="l" />
            </div>
          ) : (
            <>
              {props.spanFilters.length > 0 && (
                <EuiFlexItem grow={false}>
                  <EuiSpacer size="s" />
                  <EuiFlexGroup gutterSize="s" wrap>
                    {renderFilters}
                  </EuiFlexGroup>
                </EuiFlexItem>
              )}

              <EuiHorizontalRule margin="m" />

              <EuiFlexItem style={{ overflowY: 'auto', maxHeight: 800, minHeight: 150 }}>
                {toggleIdSelected === 'timeline'
                  ? ganttChart
                  : toggleIdSelected === 'span_list'
                  ? spanDetailTable
                  : spanDetailTableHierarchy}
              </EuiFlexItem>
            </>
          )}
        </EuiFlexGroup>
      </EuiPanel>
      {!!currentSpan && (
        <SpanDetailFlyout
          spanId={currentSpan}
          isFlyoutVisible={!!currentSpan}
          closeFlyout={() => setCurrentSpan('')}
          addSpanFilter={addSpanFilter}
          dataSourceMDSId={props.dataSourceMDSId}
          dataSourceMDSLabel={props.dataSourceMDSLabel}
          traceId={props.traceId}
          pplService={props.pplService}
          indexPattern={props.indexPattern}
          allSpans={parsedData}
        />
      )}
    </>
  );
}
