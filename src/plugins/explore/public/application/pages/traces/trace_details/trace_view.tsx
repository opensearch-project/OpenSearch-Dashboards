/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiPanel,
  EuiLoadingSpinner,
  EuiResizableContainer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiButtonEmpty,
  EuiText,
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiOverlayMask,
  EuiBadge,
} from '@elastic/eui';
import './trace_view.scss';
import { TraceTopNavMenu } from './public/top_nav_buttons';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { TracePPLService } from './server/ppl_request_trace';
import { MountPoint } from '../../../../../../../core/public';
import {
  transformPPLDataToTraceHits,
  TraceHit,
  PPLResponse,
} from './public/traces/ppl_to_trace_hits';
import { DataExplorerServices } from '../../../../../../data_explorer/public';
import { generateColorMap } from './public/traces/generate_color_map';
import { SpanDetailPanel } from './public/traces/span_detail_panel';
import { ServiceMap } from './public/services/service_map';
import { NoMatchMessage } from './public/utils/helper_functions';
import { createTraceAppState } from './state/trace_app_state';
import { SpanDetailTabs } from './public/traces/span_detail_tabs';
import { TraceDetailTabs } from './public/traces/trace_detail_tabs';
import { CorrelationService } from './public/logs/correlation_service';
import { LogHit } from './server/ppl_request_logs';
import { TraceLogsTab } from './public/logs/trace_logs_tab';
import { Dataset } from '../../../../../../data/common';
import { TraceDetailTab } from './constants/trace_detail_tabs';
import { isSpanError } from './public/traces/ppl_resolve_helpers';

export interface SpanFilter {
  field: string;
  value: string | number | boolean;
}

interface ResizeObserverTarget extends Element {
  _lastWidth?: number;
  _lastHeight?: number;
}

export interface TraceDetailsProps {
  setMenuMountPoint?: (mount: MountPoint | undefined) => void;
  isEmbedded?: boolean;
}

export const TraceDetails: React.FC<TraceDetailsProps> = ({
  setMenuMountPoint,
  isEmbedded = false,
}) => {
  const {
    services: { chrome, data, osdUrlStateStorage, savedObjects, uiSettings },
  } = useOpenSearchDashboards<DataExplorerServices>();

  // Initialize URL state management
  const { stateContainer, stopStateSync } = useMemo(() => {
    return createTraceAppState({
      stateDefaults: {
        traceId: '',
        dataset: {
          id: 'default-dataset-id',
          title: 'otel-v1-apm-span-*',
          type: 'INDEX_PATTERN',
          timeFieldName: 'endTime',
        },
        spanId: undefined,
      },
      osdUrlStateStorage: osdUrlStateStorage!,
    });
  }, [osdUrlStateStorage]);

  // Get current state values and subscribe to changes
  const [appState, setAppState] = useState(() => stateContainer.get());
  const { traceId, dataset, spanId } = appState;

  // Subscribe to state changes
  useEffect(() => {
    const subscription = stateContainer.state$.subscribe((newState) => {
      setAppState(newState);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [stateContainer]);

  const [transformedHits, setTransformedHits] = useState<TraceHit[]>([]);
  const [spanFilters, setSpanFilters] = useState<SpanFilter[]>([]);
  const [pplQueryData, setPplQueryData] = useState<PPLResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBackgroundLoading, setIsBackgroundLoading] = useState<boolean>(false);
  const [unfilteredHits, setUnfilteredHits] = useState<TraceHit[]>([]);
  const mainPanelRef = useRef<HTMLDivElement | null>(null);
  const [visualizationKey, setVisualizationKey] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>(TraceDetailTab.TIMELINE);
  const [isServiceLegendOpen, setIsServiceLegendOpen] = useState(false);
  const [logsData, setLogsData] = useState<LogHit[]>([]);
  const [logDatasets, setLogDatasets] = useState<Dataset[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState<boolean>(false);

  // Create PPL service instance
  const pplService = useMemo(() => (data ? new TracePPLService(data) : undefined), [data]);

  // Create correlation service instance
  const correlationService = useMemo(
    () =>
      savedObjects?.client && uiSettings
        ? new CorrelationService(savedObjects.client, uiSettings)
        : undefined,
    [savedObjects?.client, uiSettings]
  );

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

  const setSpanFiltersWithStorage = (newFilters: SpanFilter[]) => {
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

  // Check for correlations and fetch logs data
  useEffect(() => {
    if (dataset?.id && correlationService && data && traceId) {
      setIsLogsLoading(true);
      correlationService
        .checkCorrelationsAndFetchLogs(dataset, data, traceId)
        .then((result) => {
          setLogDatasets(result.logDatasets);
          setLogsData(result.logs);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Error fetching logs:', error);
        })
        .finally(() => {
          setIsLogsLoading(false);
        });
    }
  }, [dataset, correlationService, data, traceId]);

  useEffect(() => {
    const fetchData = async (filters: SpanFilter[] = []) => {
      if (!pplService || !traceId || !dataset) return;

      // Only show full loading spinner on initial load
      if (transformedHits.length === 0) {
        setIsLoading(true);
      } else {
        // Use background loading for filter updates
        setIsBackgroundLoading(true);
      }

      try {
        // Separate client-side filters from server-side filters
        const serverFilters = filters.filter((filter) => filter.field !== 'isError');

        const response = await pplService.fetchTraceSpans({
          traceId,
          dataset,
          limit: 100,
          filters: serverFilters,
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

    if (traceId && dataset && pplService) {
      fetchData(spanFilters);
    }
  }, [traceId, dataset, pplService, spanFilters, transformedHits.length]);

  useEffect(() => {
    if (!pplQueryData) return;
    // Transform the PPL data to trace hits format
    const transformed = transformPPLDataToTraceHits(pplQueryData);
    let hits = transformed.length > 0 ? transformed : [];

    // Apply client-side filters
    const clientFilters = spanFilters.filter((filter) => filter.field === 'isError');
    if (clientFilters.length > 0) {
      clientFilters.forEach((filter) => {
        if (filter.field === 'isError' && filter.value === true) {
          hits = hits.filter((span: TraceHit) => isSpanError(span));
        }
      });
    }

    setTransformedHits(hits);
    if (spanFilters.length === 0) {
      setUnfilteredHits(hits);
    }
  }, [pplQueryData, spanFilters]);

  // Cleanup state sync on unmount
  useEffect(() => {
    return () => {
      stopStateSync();
    };
  }, [stopStateSync]);

  // Find selected span, with fallback to root span logic
  const selectedSpan = useMemo((): TraceHit | undefined => {
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
    return transformedHits.reduce((earliest: TraceHit | undefined, current: TraceHit) => {
      if (!earliest) return current;
      const earliestTime = new Date(earliest.startTime || 0).getTime();
      const currentTime = new Date(current.startTime || 0).getTime();
      return currentTime < earliestTime ? current : earliest;
    }, undefined);
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

  // Calculate error count based on unfiltered hits to show total errors in trace
  const errorCount = useMemo(() => {
    return unfilteredHits.filter((span: TraceHit) => isSpanError(span)).length;
  }, [unfilteredHits]);

  // Extract services in the order they appear in the data
  const servicesInOrder = useMemo(() => {
    if (!colorMap) return [];
    const serviceSet = new Set<string>();
    transformedHits.forEach((span: TraceHit) => {
      const serviceName = span.serviceName;
      if (serviceName && colorMap[serviceName]) {
        serviceSet.add(serviceName);
      }
    });
    return Array.from(serviceSet);
  }, [transformedHits, colorMap]);

  const handleErrorFilterClick = () => {
    const newFilters = [...spanFilters];

    // Remove any existing error-related filters
    const filteredFilters = newFilters.filter(
      (filter) =>
        !(filter.field === 'status.code' && filter.value === 2) &&
        !(filter.field === 'isError' && filter.value === true)
    );

    // Add a comprehensive error filter that matches the isSpanError logic
    filteredFilters.push({ field: 'isError', value: true });

    setSpanFiltersWithStorage(filteredFilters);
  };

  // Function to remove a specific filter
  const removeFilter = (filterToRemove: SpanFilter) => {
    const newFilters = spanFilters.filter(
      (filter) => !(filter.field === filterToRemove.field && filter.value === filterToRemove.value)
    );
    setSpanFiltersWithStorage(newFilters);
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setSpanFiltersWithStorage([]);
  };

  // Function to format filter display text
  const getFilterDisplayText = (filter: SpanFilter) => {
    if (filter.field === 'status.code' && filter.value === 2) {
      return 'Error';
    }
    if (filter.field === 'isError' && filter.value === true) {
      return 'Error';
    }
    return `${filter.field}: ${filter.value}`;
  };

  // Set up ResizeObserver to detect when the main panel size changes
  // Only enable this in non-embedded mode to avoid crashes in embedded contexts
  useEffect(() => {
    if (!mainPanelRef.current || isEmbedded) return;

    let resizeTimeout: NodeJS.Timeout;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        // Only trigger resize if there's a significant size change (more than 10px)
        // This prevents minor mouse-induced resizes
        const target = entry.target as ResizeObserverTarget;
        if (
          Math.abs(width - (target._lastWidth || 0)) > 10 ||
          Math.abs(height - (target._lastHeight || 0)) > 10
        ) {
          // Store the last dimensions
          target._lastWidth = width;
          target._lastHeight = height;

          // Clear existing timeout
          if (resizeTimeout) {
            clearTimeout(resizeTimeout);
          }

          // Debounce the resize to avoid too many re-renders
          resizeTimeout = setTimeout(() => {
            forceVisualizationResize();
          }, 200);
        }
      }
    });

    resizeObserver.observe(mainPanelRef.current);

    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeObserver.disconnect();
    };
  }, [forceVisualizationResize, isEmbedded]);

  return (
    <>
      <TraceTopNavMenu payloadData={transformedHits} setMenuMountPoint={setMenuMountPoint} />

      {isLoading ? (
        <EuiPanel paddingSize="l">
          <div className="exploreTraceView__loadingContainer">
            <EuiLoadingSpinner size="xl" />
          </div>
        </EuiPanel>
      ) : (
        <>
          {transformedHits.length === 0 && <NoMatchMessage traceId={traceId} />}

          {transformedHits.length > 0 && (
            <>
              <div className="exploreTraceView__tabsContainer">
                <EuiPanel paddingSize="s">
                  <TraceDetailTabs
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    transformedHits={transformedHits}
                    errorCount={errorCount}
                    spanFilters={spanFilters}
                    handleErrorFilterClick={handleErrorFilterClick}
                    servicesInOrder={servicesInOrder}
                    setIsServiceLegendOpen={setIsServiceLegendOpen}
                    isServiceLegendOpen={isServiceLegendOpen}
                    logDatasets={logDatasets}
                    logsData={logsData}
                    isLogsLoading={isLogsLoading}
                  />
                </EuiPanel>
              </div>

              {/* Filter badges section */}
              {spanFilters.length > 0 && (
                <div className="exploreTraceView__filtersContainer">
                  <EuiPanel paddingSize="s">
                    <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
                      <EuiFlexItem>
                        <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
                          <EuiFlexItem grow={false}>
                            <EuiText size="s" color="subdued">
                              {i18n.translate('explore.traceView.filters.activeFilters', {
                                defaultMessage: 'Active filters:',
                              })}
                            </EuiText>
                          </EuiFlexItem>
                          {spanFilters.map((filter, index) => (
                            <EuiFlexItem grow={false} key={`filter-${index}`}>
                              <EuiBadge
                                color="primary"
                                iconType="cross"
                                iconSide="right"
                                iconOnClick={() => removeFilter(filter)}
                                iconOnClickAriaLabel={i18n.translate(
                                  'explore.traceView.filters.removeFilter',
                                  {
                                    defaultMessage: 'Remove filter',
                                  }
                                )}
                                data-test-subj={`filter-badge-${filter.field}-${filter.value}`}
                              >
                                {getFilterDisplayText(filter)}
                              </EuiBadge>
                            </EuiFlexItem>
                          ))}
                        </EuiFlexGroup>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiButtonEmpty
                          size="xs"
                          onClick={clearAllFilters}
                          data-test-subj="clear-all-filters-button"
                        >
                          {i18n.translate('explore.traceView.filters.clearAll', {
                            defaultMessage: 'Clear all',
                          })}
                        </EuiButtonEmpty>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiPanel>
                </div>
              )}

              {/* Resizable container underneath filter badges */}
              <EuiResizableContainer
                direction="horizontal"
                className="exploreTraceView__resizableContainer"
              >
                {(EuiResizablePanel, EuiResizableButton) => (
                  <>
                    <EuiResizablePanel initialSize={70} minSize="50%" wrapperPadding="none">
                      <EuiPanel paddingSize="s" className="exploreTraceView__contentPanel">
                        {/* Tab content */}
                        <div ref={mainPanelRef} className="exploreTraceView__mainPanel">
                          {activeTab === TraceDetailTab.SERVICE_MAP && (
                            <div style={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
                              <ServiceMap
                                hits={transformedHits}
                                colorMap={colorMap}
                                paddingSize="none"
                                hasShadow={false}
                                selectedSpanId={spanId}
                              />
                            </div>
                          )}

                          {(activeTab === TraceDetailTab.TIMELINE ||
                            activeTab === TraceDetailTab.SPAN_LIST ||
                            activeTab === TraceDetailTab.TREE_VIEW) && (
                            <SpanDetailPanel
                              key={`span-panel-${visualizationKey}`}
                              chrome={chrome}
                              spanFilters={spanFilters}
                              payloadData={JSON.stringify(transformedHits)}
                              isGanttChartLoading={isBackgroundLoading}
                              colorMap={colorMap}
                              onSpanSelect={handleSpanSelect}
                              selectedSpanId={spanId}
                              activeView={activeTab}
                            />
                          )}

                          {activeTab === TraceDetailTab.LOGS && (
                            <TraceLogsTab
                              traceId={traceId}
                              logDatasets={logDatasets}
                              logsData={logsData}
                              isLoading={isLogsLoading}
                              onSpanClick={handleSpanSelect}
                            />
                          )}
                        </div>
                      </EuiPanel>
                    </EuiResizablePanel>

                    <EuiResizableButton />

                    <EuiResizablePanel initialSize={30} minSize="300px">
                      <EuiPanel paddingSize="s" className="exploreTraceView__sidebarPanel">
                        <SpanDetailTabs
                          selectedSpan={selectedSpan}
                          addSpanFilter={(field: string, value: string | number | boolean) => {
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
                          logDatasets={logDatasets}
                          logsData={logsData}
                          isLogsLoading={isLogsLoading}
                        />
                      </EuiPanel>
                    </EuiResizablePanel>
                  </>
                )}
              </EuiResizableContainer>
            </>
          )}
        </>
      )}

      {/* Service Legend Modal */}
      {isServiceLegendOpen && (
        <EuiOverlayMask>
          <EuiModal onClose={() => setIsServiceLegendOpen(false)}>
            <EuiModalHeader>
              <EuiModalHeaderTitle>
                {i18n.translate('explore.traceView.modal.serviceLegendTitle', {
                  defaultMessage: 'Service legend',
                })}
              </EuiModalHeaderTitle>
            </EuiModalHeader>
            <EuiModalBody>
              <EuiFlexGroup direction="column" gutterSize="s">
                {servicesInOrder.map((service) => (
                  <EuiFlexItem grow={false} key={`service-legend-${service}`}>
                    <EuiFlexGroup gutterSize="xs" alignItems="center">
                      <EuiFlexItem grow={false}>
                        <div
                          className="exploreTraceView__serviceLegendColorIndicator"
                          style={{
                            backgroundColor: colorMap?.[service],
                          }}
                        />
                      </EuiFlexItem>
                      <EuiFlexItem>
                        <EuiText size="s">
                          <span>{service}</span>
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </EuiModalBody>
            <EuiModalFooter>
              <EuiButton onClick={() => setIsServiceLegendOpen(false)} fill>
                {i18n.translate('explore.traceView.modal.closeButton', {
                  defaultMessage: 'Close',
                })}
              </EuiButton>
            </EuiModalFooter>
          </EuiModal>
        </EuiOverlayMask>
      )}
    </>
  );
};
