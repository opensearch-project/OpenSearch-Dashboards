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
  EuiText,
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
import { TraceFilterBar } from './public/traces/trace_filter_bar';
import { TraceServiceFlow } from './public/services/trace_service_flow';
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
import { extractSpanDuration } from './public/utils/span_data_utils';
import { DURATION_MIN_FILTER_FIELD } from './public/traces/span_detail_tables/utils';
import { buildTraceDetailsUrl } from '../../../../components/data_table/table_cell/trace_utils/trace_utils';
import { validateRequiredTraceFields } from '../../../../utils/trace_field_validation';
import { SERVICE_NAME_FILTER_FIELD } from '../../../../utils/trace_field_constants';

/*
 * Trace:Details
 * @experimental
 */
export interface SpanFilter {
  field: string;
  value: string | number | boolean;
  /** Comparison operator for attribute filters. Defaults to '='. */
  operator?: '=' | '!=';
}

/** A filterable field surfaced from the dataset's field list. */
export interface DatasetField {
  name: string;
  type?: string;
}

// Filters applied in the browser (never sent to PPL, so they must not trigger a
// server refetch): the `isError` status toggle and the `durationMin` threshold.
const isClientSideFilter = (filter: SpanFilter): boolean =>
  filter.field === 'isError' || filter.field === DURATION_MIN_FILTER_FIELD;

interface ResizeObserverTarget extends Element {
  _lastWidth?: number;
  _lastHeight?: number;
}

export interface TraceDetailsProps {
  setMenuMountPoint?: (mount: MountPoint | undefined) => void;
  isEmbedded?: boolean;
  isFlyout?: boolean;
  defaultDataset?: DataView;
  defaultTraceId?: string;
  defaultSpanId?: string;
}
// Displaying only 10 logs in the tab
export const LOGS_DATA = 10;

export const TraceDetails: React.FC<TraceDetailsProps> = ({
  setMenuMountPoint,
  isEmbedded = false,
  isFlyout = false,
  defaultDataset,
  defaultTraceId,
  defaultSpanId,
}) => {
  const {
    services: { chrome, data, osdUrlStateStorage, savedObjects, uiSettings },
  } = useOpenSearchDashboards<DataExplorerServices>();

  // Initialize URL state management
  const { stateContainer, stopStateSync } = useMemo(() => {
    // Convert DataView to Dataset format if needed
    const getDatasetFromDataView = (dataView: DataView): Dataset => {
      // Check if already a Dataset with dataSource (not DataView with dataSourceRef)
      const existingDataSource = (dataView as any).dataSource;
      const dataSourceRef = (dataView as any).dataSourceRef;

      return {
        id: dataView.id || 'default-dataset-id',
        title: dataView.title,
        type: dataView.type || 'INDEX_PATTERN',
        timeFieldName: dataView.timeFieldName,
        dataSource:
          existingDataSource ||
          (dataSourceRef
            ? {
                id: dataSourceRef.id,
                title: dataSourceRef.name || dataSourceRef.id,
                type: dataSourceRef.type || 'OpenSearch',
              }
            : undefined),
      };
    };

    return createTraceAppState({
      stateDefaults: {
        traceId: defaultTraceId || '',
        dataset: defaultDataset
          ? getDatasetFromDataView(defaultDataset)
          : {
              id: 'default-dataset-id',
              title: 'otel-v1-apm-span-*',
              type: 'INDEX_PATTERN',
              timeFieldName: 'startTime',
            },
        spanId: defaultSpanId,
      },
      osdUrlStateStorage: osdUrlStateStorage!,
      disableUrlSync: isFlyout,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osdUrlStateStorage, isFlyout]);

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
  // Filterable fields surfaced from the dataset (data view) field list, merged
  // UI-side with the fields present in the current result — restricted so the
  // attribute filter only offers known-valid field paths.
  const [datasetFields, setDatasetFields] = useState<DatasetField[]>([]);
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

  // Server-side (PPL) filters are everything except the client-side filters.
  // Keyed so the trace refetch below only re-runs when they change (client-side
  // filters are applied in-browser and must not trigger a refetch).
  const serverFilterKey = useMemo(
    () => JSON.stringify(spanFilters.filter((filter) => !isClientSideFilter(filter))),
    [spanFilters]
  );

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
        const serverFilters = filters.filter((filter) => !isClientSideFilter(filter));

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
    // Refetch when the trace changes or when server-side filters change
    // (serverFilterKey). spanFilters itself is intentionally excluded to avoid
    // an extra refetch when only the client-side isError toggle changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [traceId, dataset, pplService, serverFilterKey]);

  useEffect(() => {
    if (!pplQueryData) return;
    // Transform the PPL data to trace hits format
    const transformed = transformPPLDataToTraceHits(pplQueryData);
    let hits = transformed.length > 0 ? transformed : [];

    // Apply client-side filters
    const clientFilters = spanFilters.filter(isClientSideFilter);
    clientFilters.forEach((filter) => {
      if (filter.field === 'isError' && filter.value === true) {
        hits = hits.filter((span: TraceHit) => isSpanError(span));
      }
      if (filter.field === DURATION_MIN_FILTER_FIELD) {
        hits = hits.filter(
          (span: TraceHit) => extractSpanDuration(span) >= (filter.value as number)
        );
      }
    });

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

  // Load the dataset's filterable fields (data view field list), merged UI-side
  // with fields present in the current result. Fields starting with "_" and
  // non-scalar types are excluded so the attribute filter offers valid paths.
  useEffect(() => {
    let cancelled = false;
    const excludedTypes = new Set(['_source', 'unknown', 'nested', 'geo_point', 'geo_shape']);
    // The generic "+ Add filter" only offers serviceName + span attributes +
    // resource attributes + instrumentation scope (status/duration have their
    // own quick controls); everything else is out of scope for attribute filters.
    const isFilterableField = (name: string): boolean =>
      name === 'serviceName' ||
      name.startsWith('attributes.') ||
      name.startsWith('resource.attributes.') ||
      name.startsWith('instrumentationScope.');
    const loadFields = async () => {
      const merged = new Map<string, DatasetField>();
      try {
        if (dataset?.id && (data as any)?.dataViews?.get) {
          const dataView = await (data as any).dataViews.get(dataset.id);
          (dataView?.fields ?? []).forEach((field: any) => {
            if (field?.name && !excludedTypes.has(field.type) && isFilterableField(field.name)) {
              merged.set(field.name, { name: field.name, type: field.type });
            }
          });
        }
      } catch (e) {
        // Dataset may not resolve to a saved data view — fall back to the result schema.
      }
      (pplQueryData?.schema ?? []).forEach((field) => {
        if (field?.name && isFilterableField(field.name) && !merged.has(field.name)) {
          merged.set(field.name, { name: field.name, type: field.type });
        }
      });
      if (!cancelled) {
        setDatasetFields(Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name)));
      }
    };
    loadFields();
    return () => {
      cancelled = true;
    };
  }, [dataset?.id, data, pplQueryData]);

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

  // Add (or replace) a field filter — shared by the span-detail metadata tab, the
  // trace map (service click), and the "+ Add filter" attribute bar. A field is
  // held once; re-adding it (e.g. with a different operator/value) replaces it.
  const addSpanFilter = (
    field: string,
    value: string | number | boolean,
    operator: '=' | '!=' = '='
  ) => {
    const newFilters = [...spanFilters];
    const index = newFilters.findIndex(({ field: filterField }) => field === filterField);
    if (index === -1) {
      newFilters.push({ field, value, operator });
    } else {
      newFilters.splice(index, 1, { field, value, operator });
    }
    setSpanFiltersWithStorage(newFilters);
  };

  const activeServiceFilter = spanFilters.find((f) => f.field === SERVICE_NAME_FILTER_FIELD)
    ?.value as string | undefined;

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

  // Replace one existing filter in place (atomically, preserving position) with
  // an edited field/value/operator. Used by the chip edit flow so updating a
  // filter never appends a duplicate — appends only happen via addSpanFilter
  // ("Add filter"). Matching by the old filter's identity avoids the stale-state
  // race of a separate remove + add.
  const replaceFilter = (
    oldFilter: SpanFilter,
    field: string,
    value: string | number | boolean,
    operator: '=' | '!=' = '='
  ) => {
    const matches = (filter: SpanFilter) =>
      filter.field === oldFilter.field &&
      filter.value === oldFilter.value &&
      (filter.operator ?? '=') === (oldFilter.operator ?? '=');
    let replaced = false;
    const newFilters = spanFilters
      .map((filter) => {
        if (!matches(filter)) return filter;
        replaced = true;
        return { field, value, operator };
      })
      // If the edit collides with another existing filter on the same field,
      // drop that duplicate (keep the just-edited one).
      .filter(
        (filter, index, arr) =>
          arr.findIndex(
            (other) =>
              other.field === filter.field &&
              other.value === filter.value &&
              (other.operator ?? '=') === (filter.operator ?? '=')
          ) === index
      );
    setSpanFiltersWithStorage(replaced ? newFilters : [...spanFilters, { field, value, operator }]);
  };

  // Function to remove a specific filter
  const removeFilter = (filterToRemove: SpanFilter) => {
    const newFilters = spanFilters.filter(
      (filter) =>
        !(
          filter.field === filterToRemove.field &&
          filter.value === filterToRemove.value &&
          (filter.operator ?? '=') === (filterToRemove.operator ?? '=')
        )
    );
    setSpanFiltersWithStorage(newFilters);
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setSpanFiltersWithStorage([]);
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

            {/* Filter bar (query-builder style). Span filters scope the span-based
                tabs only — hide on the Related logs tab. */}
            {activeTab !== TraceDetailTab.LOGS && (
              <div className="exploreTraceView__filtersContainer">
                <TraceFilterBar
                  spanFilters={spanFilters}
                  datasetFields={datasetFields}
                  spans={unfilteredHits}
                  addSpanFilter={addSpanFilter}
                  removeFilter={removeFilter}
                  replaceFilter={replaceFilter}
                  clearAllFilters={clearAllFilters}
                  setSpanFiltersWithStorage={setSpanFiltersWithStorage}
                />
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
                          <div
                            style={{
                              // Bounded height in the flyout (vertical split) so the graph
                              // stays compact and fully visible; full height on the page.
                              height: isFlyout ? 500 : 'calc(100vh - 200px)',
                              overflow: 'hidden',
                            }}
                          >
                            <TraceServiceFlow
                              hits={transformedHits}
                              colorMap={colorMap}
                              activeServiceFilter={activeServiceFilter}
                              onFilterService={(serviceName) =>
                                addSpanFilter(SERVICE_NAME_FILTER_FIELD, serviceName)
                              }
                              // The narrow flyout shows the whole graph fit-to-view,
                              // so the minimap would only cover nodes — hide it there.
                              showMinimap={!isFlyout}
                            />
                          </div>
                        )}

                        {(activeTab === TraceDetailTab.TIMELINE ||
                          activeTab === TraceDetailTab.SPAN_LIST) && (
                          <SpanDetailPanel
                            // Keyed only on the resize-driven visualizationKey. It
                            // updates in place via payloadData/filters props; keying
                            // on spanFilters/hits length caused a double remount
                            // (flash) on every filter change.
                            key={`span-panel-${visualizationKey}`}
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
                            allTraceSpans={unfilteredHits}
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
                        addSpanFilter={addSpanFilter}
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
