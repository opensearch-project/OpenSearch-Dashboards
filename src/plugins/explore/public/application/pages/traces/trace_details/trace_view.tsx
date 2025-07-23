/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { i18n } from '@osd/i18n';
import { EuiSpacer, EuiPanel, EuiLoadingSpinner, EuiResizableContainer } from '@elastic/eui';
import { TraceTopNavMenu } from './public/top_nav_buttons';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { TracePPLService } from './server/ppl_request_trace';
import { MountPoint } from '../../../../../../../core/public';
import { transformPPLDataToTraceHits } from './public/traces/ppl_to_trace_hits';
import { DataExplorerServices } from '../../../../../../data_explorer/public';
import { generateColorMap } from './public/traces/generate_color_map';
import { SpanDetailPanel } from './public/traces/span_detail_panel';
import { ServiceMap } from './public/services/service_map';
import { NoMatchMessage } from './public/utils/helper_functions';
import { createTraceAppState } from './state/trace_app_state';
import { SpanDetailSidebar } from './public/traces/span_detail_sidebar';

export interface TraceDetailsProps {
  setMenuMountPoint?: (mount: MountPoint | undefined) => void;
}

export const TraceDetails: React.FC<TraceDetailsProps> = ({ setMenuMountPoint }) => {
  const {
    services: { chrome, data, osdUrlStateStorage },
  } = useOpenSearchDashboards<DataExplorerServices>();

  // Initialize URL state management
  const { stateContainer, stopStateSync } = useMemo(() => {
    return createTraceAppState({
      stateDefaults: {
        traceId: '',
        dataSourceId: '',
        indexPattern: 'otel-v1-apm-span-*',
        spanId: undefined,
      },
      osdUrlStateStorage: osdUrlStateStorage!,
    });
  }, [osdUrlStateStorage]);

  // Get current state values and subscribe to changes
  const [appState, setAppState] = useState(() => stateContainer.get());
  const { traceId, dataSourceId, indexPattern, spanId } = appState;

  // Subscribe to state changes
  useEffect(() => {
    const subscription = stateContainer.state$.subscribe((newState) => {
      setAppState(newState);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [stateContainer]);

  const [transformedHits, setTransformedHits] = useState<any[]>([]);
  const [spanFilters, setSpanFilters] = useState<any[]>([]);
  const [pplQueryData, setPplQueryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState<boolean>(false);
  const [unfilteredHits, setUnfilteredHits] = useState<any[]>([]);
  const mainPanelRef = useRef<HTMLDivElement | null>(null);
  const [visualizationKey, setVisualizationKey] = useState<number>(0);

  // Create PPL service instance
  const pplService = useMemo(() => (data ? new TracePPLService(data) : undefined), [data]);

  // Generate dynamic color map based on unfiltered hits
  const colorMap = useMemo(() => {
    try {
      if (unfilteredHits.length > 0) {
        return generateColorMap(unfilteredHits);
      }
      return {};
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error generating color map:', error);
      return {};
    }
  }, [unfilteredHits]);

  const setSpanFiltersWithStorage = (newFilters: any[]) => {
    setSpanFilters(newFilters);
  };

  useEffect(() => {
    chrome?.setBreadcrumbs([
      {
        text: traceId
          ? i18n.translate('explore.traceDetails.breadcrumb.traceTitle', {
              defaultMessage: 'Trace: {traceId}',
              values: { traceId },
            })
          : i18n.translate('explore.traceDetails.breadcrumb.unknownTrace', {
              defaultMessage: 'Unknown Trace',
            }),
      },
    ]);
  }, [chrome, traceId]);

  useEffect(() => {
    const fetchData = async (filters: any[] = []) => {
      if (!pplService || !traceId || !dataSourceId) return;

      // Only show full loading spinner on initial load
      if (transformedHits.length === 0) {
        setIsLoading(true);
      } else {
        // Use background loading for filter updates
        setIsBackgroundLoading(true);
      }

      try {
        const response = await pplService.fetchTraceSpans({
          traceId,
          dataSourceId,
          indexPattern,
          limit: 100,
          filters,
        });
        setPplQueryData(response);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch trace data:', err);
      } finally {
        setIsLoading(false);
        setIsBackgroundLoading(false);
      }
    };

    if (traceId && dataSourceId && pplService) {
      fetchData(spanFilters);
    }
  }, [traceId, dataSourceId, pplService, spanFilters, indexPattern, transformedHits.length]);

  useEffect(() => {
    if (!pplQueryData) return;
    // Transform the PPL data to trace hits format
    const transformed = transformPPLDataToTraceHits(pplQueryData);
    const hits = transformed.length > 0 ? transformed : [];
    setTransformedHits(hits);
    if (spanFilters.length === 0) {
      setUnfilteredHits(hits);
    }
  }, [pplQueryData, spanFilters.length]);

  // Cleanup state sync on unmount
  useEffect(() => {
    return () => {
      stopStateSync();
    };
  }, [stopStateSync]);

  // Find selected span, with fallback to root span logic
  const selectedSpan = useMemo(() => {
    if (transformedHits.length === 0) return undefined;

    // If we have a specific spanId, try to find it first
    if (spanId) {
      const found = transformedHits.find((span) => span.spanId === spanId);
      if (found) return found;
    }

    // Fallback to root span logic if no specific span selected or found
    const spanWithoutParent = transformedHits.find((span) => !span.parentSpanId);
    if (spanWithoutParent) return spanWithoutParent;

    // If no span without parent, find the earliest span by start time
    return transformedHits.reduce((earliest, current) => {
      if (!earliest) return current;
      const earliestTime = new Date(earliest.startTime || 0).getTime();
      const currentTime = new Date(current.startTime || 0).getTime();
      return currentTime < earliestTime ? current : earliest;
    }, null);
  }, [spanId, transformedHits]);

  // Update URL state when fallback span selection occurs
  useEffect(() => {
    if (selectedSpan && selectedSpan.spanId !== spanId) {
      // Only update if the selected span is different from the current spanId
      // This handles the case where filtering causes the original span to disappear
      stateContainer.transitions.setSpanId(selectedSpan.spanId);
    }
  }, [selectedSpan, spanId, stateContainer]);

  const handleSpanSelect = (selectedSpanId: string) => {
    stateContainer.transitions.setSpanId(selectedSpanId);
  };

  // Force re-render of visualizations when container size changes
  const forceVisualizationResize = useCallback(() => {
    setVisualizationKey((prev) => prev + 1);
  }, []);

  // Set up ResizeObserver to detect when the main panel size changes
  useEffect(() => {
    if (!mainPanelRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Debounce the resize to avoid too many re-renders
        setTimeout(() => {
          forceVisualizationResize();
        }, 100);
      }
    });

    resizeObserver.observe(mainPanelRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [forceVisualizationResize]);

  return (
    <>
      <TraceTopNavMenu
        payloadData={transformedHits}
        setMenuMountPoint={setMenuMountPoint}
        dataSourceMDSId={[{ id: dataSourceId, label: '' }]}
        traceId={traceId}
      />

      {isLoading ? (
        <EuiPanel paddingSize="l">
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200,
            }}
          >
            <EuiLoadingSpinner size="xl" />
          </div>
        </EuiPanel>
      ) : (
        <>
          {transformedHits.length === 0 && <NoMatchMessage traceId={traceId} />}

          {transformedHits.length > 0 && (
            <EuiResizableContainer direction="horizontal" style={{ height: 'calc(100vh - 100px)' }}>
              {(EuiResizablePanel, EuiResizableButton) => (
                <>
                  <EuiResizablePanel initialSize={70} minSize="50%" wrapperPadding="none">
                    <div ref={mainPanelRef} style={{ height: '100%' }}>
                      <ServiceMap
                        hits={transformedHits}
                        colorMap={colorMap}
                        paddingSize="s"
                        hasShadow={false}
                        selectedSpanId={spanId}
                      />
                      <EuiSpacer size="s" />

                      <SpanDetailPanel
                        key={`span-panel-${visualizationKey}`}
                        chrome={chrome}
                        spanFilters={spanFilters}
                        setSpanFiltersWithStorage={setSpanFiltersWithStorage}
                        payloadData={JSON.stringify(transformedHits)}
                        isGanttChartLoading={isBackgroundLoading}
                        dataSourceMDSId={dataSourceId}
                        dataSourceMDSLabel={undefined}
                        traceId={traceId}
                        pplService={pplService}
                        indexPattern={indexPattern}
                        colorMap={colorMap}
                        onSpanSelect={handleSpanSelect}
                        selectedSpanId={spanId}
                      />
                    </div>
                  </EuiResizablePanel>

                  <EuiResizableButton />

                  <EuiResizablePanel initialSize={30} minSize="300px">
                    <div style={{ height: '100%' }}>
                      <SpanDetailSidebar
                        selectedSpan={selectedSpan}
                        addSpanFilter={(field: string, value: any) => {
                          const newFilters = [...spanFilters];
                          const index = newFilters.findIndex(
                            ({ field: filterField }) => field === filterField
                          );
                          if (index === -1) {
                            newFilters.push({ field, value });
                          } else {
                            newFilters.splice(index, 1, { field, value });
                          }
                          setSpanFiltersWithStorage(newFilters);
                        }}
                        setCurrentSpan={handleSpanSelect}
                      />
                    </div>
                  </EuiResizablePanel>
                </>
              )}
            </EuiResizableContainer>
          )}
        </>
      )}
    </>
  );
};
