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
  EuiButtonEmpty,
  EuiText,
  EuiBadge,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiSpacer,
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
import {
  NoMatchMessage,
  getServiceInfo,
  MissingFieldsEmptyState,
} from './public/utils/helper_functions';
import { createTraceAppState } from './state/trace_app_state';
import { SpanDetailTabs } from './public/traces/span_detail_tabs';
import { TraceDetailTabs } from './public/traces/trace_detail_tabs';
import { CorrelationService } from './public/logs/correlation_service';
import { LogHit } from './server/ppl_request_logs';
import { TraceLogsTab } from './public/logs/trace_logs_tab';
import { DataView, Dataset } from '../../../../../../data/common';
import { TraceDetailTab } from './constants/trace_detail_tabs';
import { isSpanError } from './public/traces/ppl_resolve_helpers';
import { buildTraceDetailsUrl } from '../../../../components/data_table/table_cell/trace_utils/trace_utils';
import { validateRequiredTraceFields } from '../../../../utils/trace_field_validation';

/*
 * Trace:Details
 * @experimental
 */
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
  isFlyout?: boolean;
  defaultDataset?: DataView;
}
// Displaying only 10 logs in the tab
export const LOGS_DATA = 10;

export const TraceDetails: React.FC<TraceDetailsProps> = ({
  setMenuMountPoint,
  isEmbedded = false,
  isFlyout = false,
  defaultDataset,
}) => {
  const {
    services: { chrome, data, osdUrlStateStorage, savedObjects, uiSettings },
  } = useOpenSearchDashboards<DataExplorerServices>();

  // Initialize URL state management
  const { stateContainer, stopStateSync } = useMemo(() => {
    // Convert DataView to Dataset format if needed
    const getDatasetFromDataView = (dataView: DataView): Dataset => {
      return {
        id: dataView.id || 'default-dataset-id',
        title: dataView.title,
        type: dataView.type || 'INDEX_PATTERN',
        timeFieldName: dataView.timeFieldName,
        // @ts-expect-error TS2322 TODO(ts-error): fixme
        dataSource: dataView.dataSourceRef
          ? {
              id: dataView.dataSourceRef.id,
              title: dataView.dataSourceRef.name || dataView.dataSourceRef.id,
              type: dataView.dataSourceRef.type || 'OpenSearch',
            }
          : undefined,
      };
    };

    return createTraceAppState({
      stateDefaults: {
        traceId: '',
        dataset: defaultDataset
          ? getDatasetFromDataView(defaultDataset)
          : {
              id: 'default-dataset-id',
              title: 'otel-v1-apm-span-*',
              type: 'INDEX_PATTERN',
              timeFieldName: 'endTime',
            },
        spanId: undefined,
      },
      osdUrlStateStorage: osdUrlStateStorage!,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const [isBackgroundLoading, setIsBackgroundLoading] = useState<boolean>(false);
  const [unfilteredHits, setUnfilteredHits] = useState<TraceHit[]>([]);
  const mainPanelRef = useRef<HTMLDivElement | null>(null);
  const [visualizationKey, setVisualizationKey] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>(TraceDetailTab.TIMELINE);
  const [spanDetailActiveTab, setSpanDetailActiveTab] = useState<string>('overview');

  // Preserve tab state across span changes by using a ref to track if we should reset
  const shouldResetTabRef = useRef<boolean>(false);
  const prevSpanIdRef = useRef<string | undefined>(spanId);

  // Only reset tab to overview when explicitly needed (e.g., when logs tab becomes unavailable)
  useEffect(() => {
    // Don't reset tab just because span changed
    if (prevSpanIdRef.current !== spanId) {
      prevSpanIdRef.current = spanId;
      // Only reset if we explicitly need to (this will be handled by the child component)
      shouldResetTabRef.current = false;
    }
  }, [spanId]);
  const [logDatasets, setLogDatasets] = useState<Dataset[]>([]);
  const [datasetLogs, setDatasetLogs] = useState<Record<string, LogHit[]>>({});
  const [logHitCount, setLogHitCount] = useState<number>(0);
  const [isLogsLoading, setIsLogsLoading] = useState<boolean>(false);
  const [fieldValidation, setFieldValidation] = useState<{
    isValid: boolean;
    missingFields: string[];
  } | null>(null);
  const [prevTraceId, setPrevTraceId] = useState<string | undefined>(undefined);

  // Create PPL service instance
  const pplService = useMemo(() => new TracePPLService(data), [data]);

  // Create correlation service instance
  const correlationService = useMemo(
    () =>
      savedObjects?.client && uiSettings
        ? new CorrelationService(savedObjects.client, uiSettings, data)
        : undefined,
    [savedObjects?.client, uiSettings, data]
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

  // Check for correlations and fetch logs data
  useEffect(() => {
    if (dataset?.id && correlationService && data && traceId) {
      setIsLogsLoading(true);
      correlationService
        .checkCorrelationsAndFetchLogs(dataset, data, traceId, LOGS_DATA)
        .then((result) => {
          setLogDatasets(result.logDatasets);
          setDatasetLogs(result.datasetLogs);
          setLogHitCount(result.logHitCount);
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

  const isLoading = prevTraceId !== traceId && traceId !== undefined;

  useEffect(() => {
    const fetchData = async (filters: SpanFilter[] = []) => {
      if (!pplService || !traceId || !dataset) return;

      if (isLoading) {
        setTransformedHits([]);
        setUnfilteredHits([]);
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
        setIsBackgroundLoading(false);
        setPrevTraceId(traceId);
      }
    };

    // Handle the case where traceId is null/missing - validate as missing field
    if (!traceId) {
      const validation = validateRequiredTraceFields({ traceId: null } as any);
      setFieldValidation(validation);
      return;
    }

    if (traceId && dataset && pplService) {
      fetchData(spanFilters);
    }
    // Including transformedHits.length causes duplicate ppl query calls
    // Including spanFilters causes double re-renders when changing filters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traceId, dataset, pplService]);

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

    hits = hits.filter((hit) => {
      const hasUnixNano = !!hit.startTimeUnixNano && !!hit.endTimeUnixNano;
      const hasRegularTime = !!hit.startTime && !!hit.endTime;
      return hasUnixNano || hasRegularTime;
    });

    setTransformedHits(hits);
    if (spanFilters.length === 0) {
      setUnfilteredHits(hits);
    }

    // Validate fields from either hits or raw PPL data
    if (hits.length > 0) {
      const validation = validateRequiredTraceFields(hits[0] as any);
      setFieldValidation(validation);
    } else if (pplQueryData.datarows && pplQueryData.datarows.length > 0 && pplQueryData.schema) {
      // If we have raw data but no processed hits, validate the raw data
      const rawDataObject: any = {};
      pplQueryData.schema.forEach((field, index) => {
        rawDataObject[field.name] = pplQueryData.datarows![0][index];
      });
      const validation = validateRequiredTraceFields(rawDataObject);
      setFieldValidation(validation);
    } else {
      setFieldValidation(null);
    }
  }, [pplQueryData, spanFilters]);

  // Cleanup state sync on unmount
  useEffect(() => {
    return () => {
      stopStateSync();
    };
  }, [stopStateSync]);

  // Find root span for breadcrumb (always shows root span info)
  const rootSpan = useMemo((): TraceHit | undefined => {
    if (isLoading || transformedHits.length === 0) return undefined;

    // Find span without parent first
    const spanWithoutParent = transformedHits.find((span) => !span.parentSpanId);
    if (spanWithoutParent) return spanWithoutParent;

    // If no span without parent, find the earliest span by start time
    return transformedHits.reduce((earliest: TraceHit | undefined, current: TraceHit) => {
      if (!earliest) return current;
      const earliestTime = new Date(earliest.startTime || 0).getTime();
      const currentTime = new Date(current.startTime || 0).getTime();
      return currentTime < earliestTime ? current : earliest;
    }, undefined);
  }, [transformedHits, isLoading]);

  // Find selected span, with fallback to root span logic
  const selectedSpan = useMemo((): TraceHit | undefined => {
    if (isLoading || transformedHits.length === 0) return undefined;

    // If we have a specific spanId, try to find it first
    if (spanId) {
      const found = transformedHits.find((span) => span.spanId === spanId);
      if (found) return found;
    }

    // Fallback to root span if no specific span selected or found
    return rootSpan;
  }, [spanId, transformedHits, rootSpan, isLoading]);

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
    if (filter.field === 'status.code' && filter.value === 1) {
      return 'OK';
    }
    if (filter.field === 'status.code' && filter.value === 0) {
      return 'Unset';
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

  // @ts-expect-error TS2345 TODO(ts-error): fixme
  const traceDetailsLink = buildTraceDetailsUrl(spanId, traceId, dataset);

  const renderTraceDetailsContent = () => {
    return (
      <>
        {!traceId ? (
          <EuiPanel paddingSize="l">
            <EuiText textAlign="center">
              {i18n.translate('explore.traceView.noSpanSelected', {
                defaultMessage: 'No span selected',
              })}
            </EuiText>
            <EuiSpacer size="s" />
            <EuiText textAlign="center" color="subdued" size="s">
              {i18n.translate('explore.traceView.selectSpanMessage', {
                defaultMessage: 'Please select a span to view details',
              })}
            </EuiText>
          </EuiPanel>
        ) : isLoading ? (
          <EuiPanel paddingSize="l">
            <div className="exploreTraceView__loadingContainer">
              <EuiLoadingSpinner size="xl" />
            </div>
          </EuiPanel>
        ) : fieldValidation && !fieldValidation.isValid ? (
          <MissingFieldsEmptyState
            missingFields={fieldValidation.missingFields}
            dataset={dataset as any}
          />
        ) : unfilteredHits.length === 0 ? (
          <NoMatchMessage traceId={traceId} />
        ) : (
          <>
            <div className="exploreTraceView__tabsContainer">
              <EuiPanel paddingSize="none" color="transparent" hasBorder={false}>
                <TraceDetailTabs
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  transformedHits={transformedHits}
                  logDatasets={logDatasets}
                  logCount={logHitCount}
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
              className="exploreTraceView__resizableContainer"
              direction={isFlyout ? 'vertical' : 'horizontal'}
            >
              {(EuiResizablePanel, EuiResizableButton) => (
                <>
                  <EuiResizablePanel
                    initialSize={isFlyout ? 50 : 70}
                    minSize={isFlyout ? '30%' : '50%'}
                    wrapperPadding="none"
                    paddingSize="none"
                    className="visStylePanelLeft"
                  >
                    <div className="exploreTraceView__contentPanel">
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
                          activeTab === TraceDetailTab.SPAN_LIST) && (
                          <SpanDetailPanel
                            key={`span-panel-${visualizationKey}-${spanFilters.length}-${transformedHits.length}`}
                            chrome={chrome}
                            spanFilters={spanFilters}
                            setSpanFiltersWithStorage={setSpanFiltersWithStorage}
                            payloadData={JSON.stringify(transformedHits)}
                            isGanttChartLoading={isBackgroundLoading}
                            colorMap={colorMap}
                            onSpanSelect={handleSpanSelect}
                            selectedSpanId={spanId}
                            activeView={activeTab}
                            servicesInOrder={servicesInOrder}
                            isFlyoutPanel={isFlyout}
                          />
                        )}

                        {activeTab === TraceDetailTab.LOGS && (
                          <TraceLogsTab
                            traceId={traceId}
                            logDatasets={logDatasets}
                            datasetLogs={datasetLogs}
                            isLoading={isLogsLoading}
                            onSpanClick={handleSpanSelect}
                            traceDataset={dataset}
                          />
                        )}
                      </div>
                    </div>
                  </EuiResizablePanel>

                  <EuiResizableButton />

                  <EuiResizablePanel
                    initialSize={isFlyout ? 50 : 30}
                    minSize={isFlyout ? '30%' : '300px'}
                    paddingSize="none"
                    className="visStylePanelRight"
                  >
                    <div className="exploreTraceView__sidebarPanel">
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
                        datasetLogs={datasetLogs}
                        isLogsLoading={isLogsLoading}
                        activeTab={spanDetailActiveTab as any}
                        onTabChange={(tabId) => setSpanDetailActiveTab(tabId)}
                        traceDataset={dataset}
                      />
                    </div>
                  </EuiResizablePanel>
                </>
              )}
            </EuiResizableContainer>
          </>
        )}
      </>
    );
  };

  const renderTraceDetailsHeader = () => (
    <TraceTopNavMenu
      payloadData={transformedHits}
      setMenuMountPoint={setMenuMountPoint}
      traceId={traceId}
      isFlyout={isFlyout}
      title={getServiceInfo(rootSpan, traceId, isLoading)}
      traceDetailsLink={traceDetailsLink}
    />
  );

  return isFlyout ? (
    <>
      {traceId && <EuiFlyoutHeader>{renderTraceDetailsHeader()}</EuiFlyoutHeader>}
      <EuiFlyoutBody>{renderTraceDetailsContent()}</EuiFlyoutBody>
    </>
  ) : (
    <>
      {traceId && renderTraceDetailsHeader()}
      {renderTraceDetailsContent()}
    </>
  );
};
