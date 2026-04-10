/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCompressedFieldNumber,
  EuiCompressedFieldText,
  EuiCompressedSelect,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { UiSettingScope } from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { useOpenSearchDashboards } from '../../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../../types';
import { RootState } from '../../../../utils/state_management/store';
import { useQueryPanelActionDependencies } from '../../../../../components/query_panel/query_panel_widgets/query_panel_actions/use_query_panel_action_dependencies';
import { getVisualizationBuilder } from '../../../../../components/visualizations/visualization_builder';
import { QueryExecutionStatus } from '../../../../utils/state_management/types';
import {
  MetricsAlertAssociationState,
  setMetricsAlertAssociation,
} from '../../../../utils/state_management/slices/ui/ui_slice';
import {
  buildAlertingMonitorPayload,
  buildDefaultMetricsAlertFormValues,
  MetricsAlertFormValues,
  toMonitorIntervalMinutes,
  validateMetricsAlertFormValues,
} from './metrics_alerts_helpers';
import { inferPrometheusSeries } from './prometheus_series_inference';
import {
  METRICS_ALERTING_APP_ID,
  METRICS_ANOMALY_DETECTION_APP_ID,
  PROMETHEUS_DETECTOR_MODES,
} from '../../../../utils/metrics_feature_constants';

const PROMETHEUS_QUERY_LANGUAGE = 'PROMQL';
const PROMETHEUS_SOURCE_TYPE = 'PROMETHEUS';

const MONITOR_SEVERITY_OPTIONS = [
  { value: '1', text: '1 (Highest)' },
  { value: '2', text: '2 (High)' },
  { value: '3', text: '3 (Medium)' },
  { value: '4', text: '4 (Low)' },
  { value: '5', text: '5 (Lowest)' },
];

const isPrometheusQuery = (deps: any): boolean => {
  const language = String(deps?.query?.language || '').toUpperCase();
  const datasetType = String(deps?.query?.dataset?.type || '').toUpperCase();
  return language === PROMETHEUS_QUERY_LANGUAGE && datasetType === PROMETHEUS_SOURCE_TYPE;
};

const getErrorMessage = (error: any): string =>
  error?.body?.message ||
  error?.body?.error?.reason ||
  error?.body?.error ||
  error?.message ||
  'Unexpected error';

const getDependencyAwareErrorMessage = (
  error: any,
  dependency: 'alerting' | 'anomaly_detection'
): string => {
  const rawMessage = getErrorMessage(error);
  const responseStatus =
    error?.response?.status || error?.statusCode || error?.body?.statusCode || error?.body?.status;
  const serializedError =
    typeof error === 'string'
      ? error
      : typeof error?.body === 'string'
      ? error.body
      : error?.body
      ? JSON.stringify(error.body)
      : error
      ? JSON.stringify(error)
      : '';
  const normalized = `${rawMessage} ${serializedError}`.toLowerCase();
  const looksLikeMissingDependency =
    responseStatus === 404 ||
    normalized.includes('no handler found for uri') ||
    normalized.includes('endpoint not found') ||
    normalized.includes('contains unrecognized parameter') ||
    normalized.includes('not found');

  if (!looksLikeMissingDependency) {
    return rawMessage;
  }

  return dependency === 'alerting'
    ? i18n.translate('explore.metrics.alerts.tab.missingAlertingDependencyError', {
        defaultMessage:
          'Alerting is not available for monitor creation. Ensure the Alerting dashboards plugin is installed in OpenSearch Dashboards and the Alerting plugin is installed/enabled on the target OpenSearch cluster.',
      })
    : i18n.translate('explore.metrics.alerts.tab.missingAnomalyDetectionDependencyError', {
        defaultMessage:
          'Anomaly Detection is not available for detector creation. Ensure the Anomaly Detection dashboards plugin is installed in OpenSearch Dashboards and the AD plugin is installed/enabled on the target OpenSearch cluster.',
      });
};

interface CreatedMonitorInfo {
  detectorId: string;
  detectorName: string;
  monitorId: string;
  monitorName: string;
}

const normalizePromqlText = (value: string | undefined) => String(value || '').trim();

const toCreatedMonitorInfo = (association: MetricsAlertAssociationState): CreatedMonitorInfo => ({
  detectorId: association.detectorId,
  detectorName: association.detectorName,
  monitorId: association.monitorId,
  monitorName: association.monitorName,
});

const matchesMetricsAlertAssociation = (
  association: MetricsAlertAssociationState | undefined,
  promqlQuery: string,
  dataConnectionId: string,
  dataSourceId?: string,
  detectorMode?: string,
  selectedSeriesId?: string,
  selectedEntityField?: string
): association is MetricsAlertAssociationState => {
  if (!association) {
    return false;
  }

  const expectedDetectorMode = String(detectorMode || '').trim();
  const associationDetectorMode = String(association.detectorMode || '').trim();

  return (
    normalizePromqlText(association.promqlQuery) === normalizePromqlText(promqlQuery) &&
    String(association.dataConnectionId || '').trim() === String(dataConnectionId || '').trim() &&
    String(association.dataSourceId || '').trim() === String(dataSourceId || '').trim() &&
    (!expectedDetectorMode ||
      !associationDetectorMode ||
      associationDetectorMode === expectedDetectorMode) &&
    String(association.selectedSeriesId || '').trim() === String(selectedSeriesId || '').trim() &&
    String(association.selectedEntityField || '').trim() ===
      String(selectedEntityField || '').trim()
  );
};

const buildAppUrl = (
  getUrlForApp: (appId: string, options?: { path?: string }) => string,
  appId: string,
  path: string
): string | undefined => {
  const url = getUrlForApp(appId, { path });
  if (!url) {
    return undefined;
  }
  return url;
};

const getDetectorPrometheusSource = (detector: any) =>
  detector?.prometheusSource || detector?.prometheus_source || {};

const getDetectorCategoryFields = (detector: any): string[] =>
  (detector?.categoryField || detector?.category_field || [])
    .map((field: unknown) => String(field || '').trim())
    .filter(Boolean);

const getDetectorSeriesFilter = (detector: any): Record<string, string> => {
  const prometheusSource = getDetectorPrometheusSource(detector);
  const rawSeriesFilter = prometheusSource?.seriesFilter || prometheusSource?.series_filter || {};
  if (!rawSeriesFilter || typeof rawSeriesFilter !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(rawSeriesFilter)
      .map(([key, value]) => [String(key).trim(), String(value).trim()])
      .filter(([key, value]) => key && value)
  );
};

const doLabelSetsMatch = (
  expectedLabels: Record<string, string> | undefined,
  actualLabels: Record<string, string>
): boolean => {
  const expectedEntries = Object.entries(expectedLabels || {});
  if (expectedEntries.length === 0) {
    return true;
  }

  return expectedEntries.every(
    ([key, value]) => String(actualLabels[key] || '').trim() === String(value || '').trim()
  );
};

const doesDetectorMatchMetric = ({
  detector,
  promqlQuery,
  dataConnectionId,
  detectorMode,
  selectedEntityField,
  selectedSeriesLabels,
}: {
  detector: any;
  promqlQuery: string;
  dataConnectionId: string;
  detectorMode?: string;
  selectedEntityField?: string;
  selectedSeriesLabels?: Record<string, string>;
}): boolean => {
  const prometheusSource = getDetectorPrometheusSource(detector);
  const detectorQuery = normalizePromqlText(prometheusSource?.query);
  const detectorDataConnectionId = String(
    prometheusSource?.dataConnectionId || prometheusSource?.data_connection_id || ''
  ).trim();

  if (
    detectorQuery !== normalizePromqlText(promqlQuery) ||
    detectorDataConnectionId !== String(dataConnectionId || '').trim()
  ) {
    return false;
  }

  if (detectorMode === PROMETHEUS_DETECTOR_MODES.highCardinality) {
    return getDetectorCategoryFields(detector).includes(String(selectedEntityField || '').trim());
  }

  if (detectorMode === PROMETHEUS_DETECTOR_MODES.singleStream) {
    return doLabelSetsMatch(selectedSeriesLabels, getDetectorSeriesFilter(detector));
  }

  return true;
};

const extractDetectorIdFromValue = (value: any): string | undefined => {
  if (value == null) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    return String(value.value || value.term || '').trim() || undefined;
  }

  return String(value).trim() || undefined;
};

const findDetectorIdInMonitor = (value: any): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const detectorId = findDetectorIdInMonitor(item);
      if (detectorId) {
        return detectorId;
      }
    }
    return undefined;
  }

  if (typeof value !== 'object') {
    return undefined;
  }

  const explicitDetectorId = extractDetectorIdFromValue(value.detector_id || value.detectorId);
  if (explicitDetectorId) {
    return explicitDetectorId;
  }

  for (const childValue of Object.values(value)) {
    const detectorId = findDetectorIdInMonitor(childValue);
    if (detectorId) {
      return detectorId;
    }
  }

  return undefined;
};

const getMonitorFromSearchHit = (hit: any) => {
  const source = hit?._source || {};
  const monitor = source.monitor || source;
  const monitorId = String(hit?._id || monitor?.id || '').trim();
  if (!monitorId || !monitor) {
    return undefined;
  }

  return {
    id: monitorId,
    monitor,
  };
};

const getMonitorExploreMetricsMetadata = (monitor: any) =>
  monitor?.ui_metadata?.explore_metrics || monitor?.uiMetadata?.exploreMetrics;

const doesMonitorReferenceDetector = (monitor: any, detectorId: string): boolean => {
  const metadata = getMonitorExploreMetricsMetadata(monitor);
  const metadataDetectorId = String(metadata?.detector_id || metadata?.detectorId || '').trim();
  return metadataDetectorId === detectorId || findDetectorIdInMonitor(monitor) === detectorId;
};

export const MetricsAlertsPanel = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const actionDeps = useQueryPanelActionDependencies();
  const visualizationBuilder = getVisualizationBuilder();
  const visData = useObservable(visualizationBuilder.data$);
  const chartConfig = useObservable(visualizationBuilder.visConfig$);
  const availableApplications = useObservable(
    services.core.application.applications$,
    new Map<string, unknown>()
  ) as ReadonlyMap<string, unknown>;
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [existingAssociationError, setExistingAssociationError] = useState('');
  const [isLoadingExistingAssociation, setIsLoadingExistingAssociation] = useState(false);
  const [createdMonitor, setCreatedMonitor] = useState<CreatedMonitorInfo | null>(null);
  const [fallbackDataSourceId, setFallbackDataSourceId] = useState('');
  const [isResolvingDataSourceId, setIsResolvingDataSourceId] = useState(false);
  const persistedAssociation = useSelector((state: RootState) => state.ui.metricsAlertAssociation);

  const supportsPrometheusAlerts = useMemo(() => isPrometheusQuery(actionDeps), [actionDeps]);
  const isAlertingUiAvailable = useMemo(() => availableApplications.has(METRICS_ALERTING_APP_ID), [
    availableApplications,
  ]);
  const isAnomalyDetectionUiAvailable = useMemo(
    () => availableApplications.has(METRICS_ANOMALY_DETECTION_APP_ID),
    [availableApplications]
  );
  const missingUiDependencies = useMemo(() => {
    const missing: string[] = [];
    if (!isAlertingUiAvailable) {
      missing.push(
        i18n.translate('explore.metrics.alerts.tab.missingAlertingUiDependencyLabel', {
          defaultMessage: 'Alerting dashboards plugin',
        })
      );
    }
    if (!isAnomalyDetectionUiAvailable) {
      missing.push(
        i18n.translate('explore.metrics.alerts.tab.missingAdUiDependencyLabel', {
          defaultMessage: 'Anomaly Detection dashboards plugin',
        })
      );
    }
    return missing;
  }, [isAlertingUiAvailable, isAnomalyDetectionUiAvailable]);
  const isAOSSCollection = actionDeps.query?.dataset?.dataSource?.type === 'OpenSearch Serverless';
  const allowedStatuses = [
    QueryExecutionStatus.READY,
    QueryExecutionStatus.NO_RESULTS,
    QueryExecutionStatus.ERROR,
  ];
  const isStatusAllowed = allowedStatuses.includes(actionDeps.resultStatus.status);

  const promqlQuery = useMemo(
    () =>
      String((actionDeps as any)?.queryInEditor ?? (actionDeps.query as any)?.query ?? '').trim(),
    [actionDeps]
  );
  const dataConnectionId = useMemo(
    () => String((actionDeps.query as any)?.dataset?.id || '').trim(),
    [actionDeps.query]
  );
  const explicitDataSourceId = useMemo(
    () => String((actionDeps.query as any)?.dataset?.dataSource?.id || '').trim(),
    [actionDeps.query]
  );
  const currentWorkspaceId = (services.core as any)?.workspaces?.currentWorkspaceId$?.getValue?.();
  const seriesInference = useMemo(() => inferPrometheusSeries(visData, chartConfig), [
    chartConfig,
    visData,
  ]);
  const multiSeriesUnsupported = seriesInference.seriesCount > 1;
  const entityFieldOptions = useMemo(
    () =>
      seriesInference.suggestedEntityFields.map((field) => ({
        value: field,
        text: field,
      })),
    [seriesInference.suggestedEntityFields]
  );

  useEffect(() => {
    let cancelled = false;

    const resolveFallbackDataSourceId = async () => {
      const shouldResolveFallback =
        services.dataSourceEnabled &&
        services.hideLocalCluster &&
        !explicitDataSourceId &&
        !!services.dataSourceManagement?.getDefaultDataSourceId;

      if (!shouldResolveFallback) {
        setFallbackDataSourceId('');
        setIsResolvingDataSourceId(false);
        return;
      }

      setIsResolvingDataSourceId(true);
      try {
        const uiSettingsScope = currentWorkspaceId
          ? UiSettingScope.WORKSPACE
          : UiSettingScope.GLOBAL;
        const defaultDataSourceId = await services.dataSourceManagement!.getDefaultDataSourceId(
          services.uiSettings,
          uiSettingsScope
        );
        if (!cancelled) {
          setFallbackDataSourceId(String(defaultDataSourceId || '').trim());
        }
      } catch {
        if (!cancelled) {
          setFallbackDataSourceId('');
        }
      } finally {
        if (!cancelled) {
          setIsResolvingDataSourceId(false);
        }
      }
    };

    resolveFallbackDataSourceId();

    return () => {
      cancelled = true;
    };
  }, [
    explicitDataSourceId,
    currentWorkspaceId,
    services.dataSourceEnabled,
    services.dataSourceManagement,
    services.hideLocalCluster,
    services.uiSettings,
  ]);

  const dataSourceId = useMemo(() => explicitDataSourceId || fallbackDataSourceId, [
    explicitDataSourceId,
    fallbackDataSourceId,
  ]);
  const requiresManagedDataSource = services.dataSourceEnabled && services.hideLocalCluster;
  const missingManagedDataSource =
    requiresManagedDataSource && !isResolvingDataSourceId && !dataSourceId;
  const isActionAvailable =
    supportsPrometheusAlerts &&
    isStatusAllowed &&
    !isAOSSCollection &&
    missingUiDependencies.length === 0 &&
    !isResolvingDataSourceId &&
    !missingManagedDataSource;

  const defaultDetectorFormValues = useMemo(
    () =>
      buildDefaultMetricsAlertFormValues(promqlQuery, {
        detectorMode: seriesInference.defaultDetectorMode,
        selectedSeriesId: seriesInference.defaultSeriesId,
        selectedEntityField: seriesInference.defaultEntityField,
      }),
    [
      promqlQuery,
      seriesInference.defaultDetectorMode,
      seriesInference.defaultEntityField,
      seriesInference.defaultSeriesId,
    ]
  );
  const defaultFormSignature = useMemo(
    () =>
      [
        promqlQuery,
        dataConnectionId,
        dataSourceId,
        defaultDetectorFormValues.monitorName,
        defaultDetectorFormValues.scheduleIntervalMinutes,
        defaultDetectorFormValues.triggerName,
        defaultDetectorFormValues.detectorMode,
        defaultDetectorFormValues.selectedSeriesId,
        defaultDetectorFormValues.selectedEntityField,
      ].join('|'),
    [dataConnectionId, dataSourceId, defaultDetectorFormValues, promqlQuery]
  );

  const [formValues, setFormValues] = useState<MetricsAlertFormValues>(defaultDetectorFormValues);
  const selectedSeriesOption = useMemo(
    () => seriesInference.seriesOptions.find((option) => option.id === formValues.selectedSeriesId),
    [formValues.selectedSeriesId, seriesInference.seriesOptions]
  );
  const matchingAssociation = useMemo(
    () =>
      matchesMetricsAlertAssociation(
        persistedAssociation,
        promqlQuery,
        dataConnectionId,
        dataSourceId,
        multiSeriesUnsupported ? formValues.detectorMode : undefined,
        multiSeriesUnsupported && formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.singleStream
          ? formValues.selectedSeriesId
          : undefined,
        multiSeriesUnsupported &&
          formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.highCardinality
          ? formValues.selectedEntityField
          : undefined
      )
        ? persistedAssociation
        : undefined,
    [
      dataConnectionId,
      dataSourceId,
      formValues.detectorMode,
      formValues.selectedEntityField,
      formValues.selectedSeriesId,
      multiSeriesUnsupported,
      persistedAssociation,
      promqlQuery,
    ]
  );
  const persistMetricsAlertAssociation = useCallback(
    (association: MetricsAlertAssociationState | undefined) => {
      services.store.dispatch(setMetricsAlertAssociation(association));
    },
    [services.store]
  );

  useEffect(() => {
    setFormValues(defaultDetectorFormValues);
    setCreateError('');
    setExistingAssociationError('');
    setCreatedMonitor(matchingAssociation ? toCreatedMonitorInfo(matchingAssociation) : null);
  }, [defaultDetectorFormValues, defaultFormSignature, matchingAssociation]);

  useEffect(() => {
    if (!matchingAssociation || missingUiDependencies.length > 0) {
      setIsLoadingExistingAssociation(false);
      return;
    }

    let cancelled = false;

    const verifyExistingAssociation = async () => {
      setIsLoadingExistingAssociation(true);
      try {
        const [monitorResponse, detectorResponse] = await Promise.all([
          services.http.get(
            `/api/alerting/monitors/${encodeURIComponent(matchingAssociation.monitorId)}`,
            {
              ...(dataSourceId ? { query: { dataSourceId } } : {}),
            }
          ),
          services.http.get(
            dataSourceId
              ? `/api/anomaly_detectors/detectors/${encodeURIComponent(
                  matchingAssociation.detectorId
                )}/${encodeURIComponent(dataSourceId)}`
              : `/api/anomaly_detectors/detectors/${encodeURIComponent(
                  matchingAssociation.detectorId
                )}`
          ),
        ]);

        if (cancelled) {
          return;
        }

        if (monitorResponse?.ok === false) {
          throw new Error(monitorResponse?.resp || monitorResponse?.error || 'Monitor not found.');
        }

        const updatedAssociation: MetricsAlertAssociationState = {
          ...matchingAssociation,
          monitorName:
            monitorResponse?.resp?.name ||
            monitorResponse?.resp?.monitor?.name ||
            matchingAssociation.monitorName,
          detectorName: detectorResponse?.name || matchingAssociation.detectorName,
        };

        setCreatedMonitor(toCreatedMonitorInfo(updatedAssociation));
        if (
          updatedAssociation.monitorName !== matchingAssociation.monitorName ||
          updatedAssociation.detectorName !== matchingAssociation.detectorName
        ) {
          persistMetricsAlertAssociation(updatedAssociation);
        }
      } catch (_error) {
        if (cancelled) {
          return;
        }

        setCreatedMonitor(null);
        setExistingAssociationError(
          i18n.translate('explore.metrics.alerts.tab.existingAssociationUnavailableMessage', {
            defaultMessage:
              'The saved monitor or detector for this metric is no longer available. You can create a new alert monitor.',
          })
        );
        persistMetricsAlertAssociation(undefined);
      } finally {
        if (!cancelled) {
          setIsLoadingExistingAssociation(false);
        }
      }
    };

    verifyExistingAssociation();

    return () => {
      cancelled = true;
    };
  }, [
    dataSourceId,
    matchingAssociation,
    missingUiDependencies.length,
    persistMetricsAlertAssociation,
    services.http,
  ]);

  useEffect(() => {
    if (
      !isActionAvailable ||
      matchingAssociation ||
      createdMonitor ||
      isCreating ||
      !promqlQuery ||
      !dataConnectionId ||
      seriesInference.seriesCount === 0
    ) {
      return;
    }

    if (
      multiSeriesUnsupported &&
      formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.highCardinality &&
      !formValues.selectedEntityField
    ) {
      return;
    }

    if (
      multiSeriesUnsupported &&
      formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.singleStream &&
      !selectedSeriesOption
    ) {
      return;
    }

    let cancelled = false;

    const discoverExistingAssociation = async () => {
      setIsLoadingExistingAssociation(true);

      try {
        const detectorSearchPath = dataSourceId
          ? `/api/anomaly_detectors/detectors/_search/${encodeURIComponent(dataSourceId)}`
          : '/api/anomaly_detectors/detectors/_search';

        const detectorSearchResponse: any = await services.http.post(detectorSearchPath, {
          body: JSON.stringify({
            size: 1000,
            query: {
              bool: {
                filter: [
                  {
                    term: {
                      source_type: PROMETHEUS_SOURCE_TYPE,
                    },
                  },
                  {
                    term: {
                      'prometheus_source.data_connection_id': dataConnectionId,
                    },
                  },
                ],
              },
            },
          }),
        });

        if (cancelled || detectorSearchResponse?.ok === false) {
          return;
        }

        const detectorMode = multiSeriesUnsupported ? formValues.detectorMode : undefined;
        const matchingDetectors = (detectorSearchResponse?.response?.detectors || []).filter(
          (detector: any) =>
            doesDetectorMatchMetric({
              detector,
              promqlQuery,
              dataConnectionId,
              detectorMode,
              selectedEntityField:
                detectorMode === PROMETHEUS_DETECTOR_MODES.highCardinality
                  ? formValues.selectedEntityField
                  : undefined,
              selectedSeriesLabels:
                detectorMode === PROMETHEUS_DETECTOR_MODES.singleStream
                  ? selectedSeriesOption?.labels
                  : undefined,
            })
        );

        if (matchingDetectors.length === 0) {
          return;
        }

        const monitorSearchResponse: any = await services.http.post(
          '/api/alerting/monitors/_search',
          {
            body: JSON.stringify({
              size: 1000,
              query: {
                query: {
                  match_all: {},
                },
              },
            }),
            ...(dataSourceId ? { query: { dataSourceId } } : {}),
          }
        );

        if (cancelled || monitorSearchResponse?.ok === false) {
          return;
        }

        const monitorSearchHits = monitorSearchResponse?.resp?.hits?.hits || [];
        const monitors = monitorSearchHits.map(getMonitorFromSearchHit).filter(Boolean) as Array<{
          id: string;
          monitor: any;
        }>;

        for (const detector of matchingDetectors) {
          const detectorId = String(detector?.id || '').trim();
          if (!detectorId) {
            continue;
          }

          const matchingMonitor = monitors.find(({ monitor }) =>
            doesMonitorReferenceDetector(monitor, detectorId)
          );
          if (!matchingMonitor) {
            continue;
          }

          const discoveredAssociation: MetricsAlertAssociationState = {
            detectorId,
            detectorName: detector?.name || 'Prometheus detector',
            monitorId: matchingMonitor.id,
            monitorName: matchingMonitor.monitor?.name || 'Alert monitor',
            promqlQuery,
            dataConnectionId,
            dataSourceId: dataSourceId || undefined,
            detectorMode: detectorMode as MetricsAlertAssociationState['detectorMode'],
            selectedSeriesId:
              detectorMode === PROMETHEUS_DETECTOR_MODES.singleStream
                ? formValues.selectedSeriesId || undefined
                : undefined,
            selectedEntityField:
              detectorMode === PROMETHEUS_DETECTOR_MODES.highCardinality
                ? formValues.selectedEntityField || undefined
                : undefined,
          };

          if (!cancelled) {
            setExistingAssociationError('');
            setCreatedMonitor(toCreatedMonitorInfo(discoveredAssociation));
            persistMetricsAlertAssociation(discoveredAssociation);
          }
          return;
        }
      } catch (_error) {
        // Discovery is best-effort. If it fails, leave the create flow available.
      } finally {
        if (!cancelled) {
          setIsLoadingExistingAssociation(false);
        }
      }
    };

    discoverExistingAssociation();

    return () => {
      cancelled = true;
    };
  }, [
    createdMonitor,
    dataConnectionId,
    dataSourceId,
    formValues.detectorMode,
    formValues.selectedEntityField,
    formValues.selectedSeriesId,
    isActionAvailable,
    isCreating,
    matchingAssociation,
    multiSeriesUnsupported,
    persistMetricsAlertAssociation,
    promqlQuery,
    selectedSeriesOption,
    seriesInference.seriesCount,
    services.http,
  ]);

  const monitorDetailsUrl = useMemo(() => {
    if (!createdMonitor?.monitorId) {
      return undefined;
    }
    if (!isAlertingUiAvailable) {
      return undefined;
    }

    const dataSourceQuery = services.dataSourceEnabled
      ? `&dataSourceId=${encodeURIComponent(dataSourceId || '')}`
      : '';
    const path = `#/monitors/${encodeURIComponent(
      createdMonitor.monitorId
    )}?type=monitor&mode=classic${dataSourceQuery}`;
    return buildAppUrl(services.core.application.getUrlForApp, METRICS_ALERTING_APP_ID, path);
  }, [
    createdMonitor?.monitorId,
    dataSourceId,
    isAlertingUiAvailable,
    services.dataSourceEnabled,
    services.core.application.getUrlForApp,
  ]);

  const detectorDetailsUrl = useMemo(() => {
    if (!createdMonitor?.detectorId) {
      return undefined;
    }
    if (!isAnomalyDetectionUiAvailable) {
      return undefined;
    }

    return buildAppUrl(
      services.core.application.getUrlForApp,
      METRICS_ANOMALY_DETECTION_APP_ID,
      `#/detectors/${encodeURIComponent(createdMonitor.detectorId)}/results${
        dataSourceId ? `?dataSourceId=${encodeURIComponent(dataSourceId)}` : ''
      }`
    );
  }, [
    createdMonitor?.detectorId,
    dataSourceId,
    isAnomalyDetectionUiAvailable,
    services.core.application.getUrlForApp,
  ]);

  const updateFormValue = <K extends keyof MetricsAlertFormValues>(
    key: K,
    value: MetricsAlertFormValues[K]
  ) => {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }));
    setCreateError('');
  };

  const handleCreateMonitor = async () => {
    if (!promqlQuery || !dataConnectionId) {
      const errorMessage = i18n.translate(
        'explore.metrics.alerts.tab.error.missingFieldsBodyInline',
        {
          defaultMessage: 'Prometheus connection ID and query are required.',
        }
      );
      setCreateError(errorMessage);
      services.notifications.toasts.addDanger({
        title: i18n.translate('explore.metrics.alerts.tab.error.missingFieldsTitle', {
          defaultMessage: 'Unable to create alert monitor',
        }),
        text: errorMessage,
      });
      return;
    }

    if (
      multiSeriesUnsupported &&
      formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.singleStream &&
      !selectedSeriesOption
    ) {
      const errorMessage = i18n.translate(
        'explore.metrics.alerts.tab.error.missingSeriesSelection',
        {
          defaultMessage: 'Select a concrete Prometheus series before creating the detector.',
        }
      );
      setCreateError(errorMessage);
      return;
    }

    if (
      multiSeriesUnsupported &&
      formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.highCardinality &&
      !formValues.selectedEntityField
    ) {
      const errorMessage = i18n.translate(
        'explore.metrics.alerts.tab.error.missingEntityFieldSelection',
        {
          defaultMessage: 'Select an entity field before creating the high-cardinality detector.',
        }
      );
      setCreateError(errorMessage);
      return;
    }

    const validationError = validateMetricsAlertFormValues(formValues);
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setIsCreating(true);
    setCreateError('');
    setExistingAssociationError('');
    setCreatedMonitor(null);

    let detectorId = '';
    let detectorName = '';
    let monitorId = '';
    let failingDependency: 'alerting' | 'anomaly_detection' = 'anomaly_detection';

    try {
      const createDetectorPath = dataSourceId
        ? `/api/anomaly_detectors/detectors/_create_from_prometheus_query/${encodeURIComponent(
            dataSourceId
          )}`
        : '/api/anomaly_detectors/detectors/_create_from_prometheus_query';

      const createDetectorResponse: any = await services.http.post(createDetectorPath, {
        body: JSON.stringify({
          query: promqlQuery,
          dataConnectionId,
          description: 'Auto-created from Explore Metrics alerts flow.',
          detectorMode: formValues.detectorMode,
          selectedSeries:
            formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.singleStream
              ? selectedSeriesOption?.labels
              : undefined,
          entityField:
            formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.highCardinality
              ? formValues.selectedEntityField || undefined
              : undefined,
        }),
      });

      detectorId =
        createDetectorResponse?.detectorId ||
        createDetectorResponse?.response?._id ||
        createDetectorResponse?.id ||
        createDetectorResponse?._id;
      detectorName = createDetectorResponse?.detectorName || 'Prometheus detector';
      if (!createDetectorResponse?.ok || !detectorId) {
        throw new Error(createDetectorResponse?.error || 'Detector creation failed.');
      }

      const startDetectorPath = dataSourceId
        ? `/api/anomaly_detectors/detectors/${encodeURIComponent(
            detectorId
          )}/start/${encodeURIComponent(dataSourceId)}`
        : `/api/anomaly_detectors/detectors/${encodeURIComponent(detectorId)}/start`;

      const startDetectorResponse: any = await services.http.post(startDetectorPath);
      if (!startDetectorResponse?.ok) {
        throw new Error(startDetectorResponse?.error || 'Detector start failed.');
      }

      failingDependency = 'alerting';
      const monitorPayload = buildAlertingMonitorPayload({
        ...formValues,
        scheduleIntervalMinutes:
          formValues.scheduleIntervalMinutes ||
          toMonitorIntervalMinutes(createDetectorResponse?.detectionInterval),
        detectorId,
        exploreMetrics: {
          detectorId,
          detectorName,
          promqlQuery,
          dataConnectionId,
          dataSourceId: dataSourceId || undefined,
          detectorMode: formValues.detectorMode,
          selectedSeriesId:
            formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.singleStream
              ? formValues.selectedSeriesId || undefined
              : undefined,
          selectedEntityField:
            formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.highCardinality
              ? formValues.selectedEntityField || undefined
              : undefined,
          selectedSeriesLabels:
            formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.singleStream
              ? selectedSeriesOption?.labels
              : undefined,
        },
      });

      const createMonitorResponse: any = await services.http.post('/api/alerting/monitors', {
        body: JSON.stringify(monitorPayload),
        ...(dataSourceId ? { query: { dataSourceId } } : {}),
      });

      monitorId =
        createMonitorResponse?.resp?._id ||
        createMonitorResponse?.response?._id ||
        createMonitorResponse?.id ||
        createMonitorResponse?._id;
      if (!createMonitorResponse?.ok || !monitorId) {
        throw new Error(
          createMonitorResponse?.resp?.error ||
            createMonitorResponse?.error ||
            'Monitor creation failed.'
        );
      }

      const createdAssociation: MetricsAlertAssociationState = {
        detectorId,
        detectorName,
        monitorId,
        monitorName: formValues.monitorName.trim(),
        promqlQuery,
        dataConnectionId,
        dataSourceId: dataSourceId || undefined,
        detectorMode: formValues.detectorMode,
        selectedSeriesId:
          formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.singleStream
            ? formValues.selectedSeriesId || undefined
            : undefined,
        selectedEntityField:
          formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.highCardinality
            ? formValues.selectedEntityField || undefined
            : undefined,
      };

      setCreatedMonitor(toCreatedMonitorInfo(createdAssociation));
      persistMetricsAlertAssociation(createdAssociation);
      services.notifications.toasts.addSuccess(
        `Monitor "${formValues.monitorName.trim()}" successfully created.`
      );
    } catch (error: any) {
      const errorMessage = getDependencyAwareErrorMessage(error, failingDependency);
      setCreateError(errorMessage);
      services.notifications.toasts.addDanger({
        title: i18n.translate('explore.metrics.alerts.tab.error.createMonitorTitle', {
          defaultMessage: 'Failed to create alert monitor',
        }),
        text: errorMessage,
      });

      if (detectorId && !monitorId) {
        try {
          const deleteDetectorPath = dataSourceId
            ? `/api/anomaly_detectors/detectors/${encodeURIComponent(
                detectorId
              )}/${encodeURIComponent(dataSourceId)}`
            : `/api/anomaly_detectors/detectors/${encodeURIComponent(detectorId)}`;
          await services.http.delete(deleteDetectorPath);
        } catch (_rollbackError) {
          services.notifications.toasts.addWarning({
            title: i18n.translate('explore.metrics.alerts.tab.error.rollbackTitle', {
              defaultMessage: 'Partial cleanup required',
            }),
            text: i18n.translate('explore.metrics.alerts.tab.error.rollbackBody', {
              defaultMessage:
                'The monitor was not created, but the detector could not be cleaned up automatically.',
            }),
          });
        }
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="visStylePanelBody">
      <EuiText size="s">
        <p>
          {i18n.translate('explore.metrics.alerts.tab.description', {
            defaultMessage:
              'Create an anomaly-based monitor from the current Prometheus metric without leaving this page.',
          })}
        </p>
      </EuiText>

      <EuiSpacer size="m" />

      {!supportsPrometheusAlerts && (
        <>
          <EuiCallOut
            size="s"
            color="warning"
            iconType="alert"
            title={i18n.translate('explore.metrics.alerts.tab.unavailable.title', {
              defaultMessage: 'Prometheus query required',
            })}
          >
            <p>
              {i18n.translate('explore.metrics.alerts.tab.unavailable.description', {
                defaultMessage:
                  'Run a PromQL query on a Prometheus metric to create an anomaly-based monitor.',
              })}
            </p>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      )}

      {existingAssociationError && (
        <>
          <EuiCallOut
            size="s"
            color="warning"
            iconType="alert"
            title={i18n.translate(
              'explore.metrics.alerts.tab.existingAssociationUnavailableTitle',
              {
                defaultMessage: 'Saved alert association unavailable',
              }
            )}
          >
            <p>{existingAssociationError}</p>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      )}

      {requiresManagedDataSource && isResolvingDataSourceId && (
        <>
          <EuiText color="subdued" size="xs">
            <p>
              {i18n.translate('explore.metrics.alerts.tab.resolvingDataSource', {
                defaultMessage: 'Resolving the OpenSearch data source for monitor creation...',
              })}
            </p>
          </EuiText>
          <EuiSpacer size="m" />
        </>
      )}

      {missingManagedDataSource && (
        <>
          <EuiCallOut
            size="s"
            color="warning"
            iconType="alert"
            title={i18n.translate('explore.metrics.alerts.tab.missingDataSourceTitle', {
              defaultMessage: 'Compatible OpenSearch data source required',
            })}
          >
            <p>
              {i18n.translate('explore.metrics.alerts.tab.missingDataSourceBody', {
                defaultMessage:
                  'Alert monitors need a compatible OpenSearch data source when the local cluster is hidden. Select or configure a compatible data source, then try again.',
              })}
            </p>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      )}

      {missingUiDependencies.length > 0 && (
        <>
          <EuiCallOut
            size="s"
            color="warning"
            iconType="alert"
            title={i18n.translate('explore.metrics.alerts.tab.missingUiDependenciesTitle', {
              defaultMessage: 'Required alerting dependencies are unavailable',
            })}
          >
            <p>
              {i18n.translate('explore.metrics.alerts.tab.missingUiDependenciesBody', {
                defaultMessage:
                  'This Metrics alert flow needs the following OpenSearch Dashboards apps to be available: {dependencies}.',
                values: {
                  dependencies: missingUiDependencies.join(', '),
                },
              })}
            </p>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      )}

      {createdMonitor && (
        <>
          <EuiCallOut
            size="s"
            color="success"
            iconType="check"
            title={i18n.translate('explore.metrics.alerts.tab.createdTitle', {
              defaultMessage: 'Monitor available',
            })}
          >
            <p>
              {i18n.translate('explore.metrics.alerts.tab.createdBody', {
                defaultMessage:
                  'Using monitor "{monitorName}" and detector "{detectorName}" for this metric.',
                values: {
                  monitorName: createdMonitor.monitorName,
                  detectorName: createdMonitor.detectorName,
                },
              })}
            </p>
            <p>
              {i18n.translate('explore.metrics.alerts.tab.createdSaveHint', {
                defaultMessage:
                  'Save this metric or add it to a dashboard to reopen it with this monitor association.',
              })}
            </p>
            <EuiFlexGroup gutterSize="s" responsive={false}>
              {monitorDetailsUrl && (
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    size="xs"
                    href={monitorDetailsUrl}
                    data-test-subj="metricsAlertsViewMonitorButton"
                  >
                    {i18n.translate('explore.metrics.alerts.tab.viewMonitorButton', {
                      defaultMessage: 'View monitor',
                    })}
                  </EuiButtonEmpty>
                </EuiFlexItem>
              )}
              {detectorDetailsUrl && (
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    size="xs"
                    href={detectorDetailsUrl}
                    data-test-subj="metricsAlertsViewDetectorButton"
                  >
                    {i18n.translate('explore.metrics.alerts.tab.viewDetectorButton', {
                      defaultMessage: 'View detector',
                    })}
                  </EuiButtonEmpty>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      )}

      {isLoadingExistingAssociation && (
        <>
          <EuiText color="subdued" size="xs">
            <p>
              {i18n.translate('explore.metrics.alerts.tab.loadingExistingAssociation', {
                defaultMessage: 'Loading saved monitor association for this metric...',
              })}
            </p>
          </EuiText>
          <EuiSpacer size="m" />
        </>
      )}

      {isActionAvailable && !createdMonitor && (
        <>
          {multiSeriesUnsupported && (
            <>
              <EuiCallOut
                size="s"
                color="primary"
                iconType="iInCircle"
                title={i18n.translate('explore.metrics.alerts.tab.multiSeriesPreviewTitle', {
                  defaultMessage: 'Multi-series Prometheus query detected',
                })}
              >
                <p>
                  {i18n.translate('explore.metrics.alerts.tab.multiSeriesPreviewBody', {
                    defaultMessage:
                      'This metric currently renders {seriesCount} series. High-cardinality creation will create one detector entity per selected Prometheus label value. You can switch to Single stream to create a detector for one concrete series instead.',
                    values: {
                      seriesCount: seriesInference.seriesCount,
                    },
                  })}
                </p>
                {seriesInference.varyingLabels.length > 0 && (
                  <p>
                    {i18n.translate('explore.metrics.alerts.tab.multiSeriesPreviewLabels', {
                      defaultMessage: 'Varying labels: {labels}.',
                      values: {
                        labels: seriesInference.varyingLabels.join(', '),
                      },
                    })}
                  </p>
                )}
              </EuiCallOut>
              <EuiSpacer size="m" />
            </>
          )}

          {multiSeriesUnsupported && (
            <>
              <EuiFormRow
                label={i18n.translate('explore.metrics.alerts.tab.detectorModeLabel', {
                  defaultMessage: 'Detector type',
                })}
              >
                <EuiCompressedSelect
                  options={[
                    {
                      value: PROMETHEUS_DETECTOR_MODES.singleStream,
                      text: i18n.translate('explore.metrics.alerts.tab.detectorModeSingle', {
                        defaultMessage: 'Single stream',
                      }),
                    },
                    {
                      value: PROMETHEUS_DETECTOR_MODES.highCardinality,
                      text: i18n.translate('explore.metrics.alerts.tab.detectorModeHC', {
                        defaultMessage: 'High cardinality',
                      }),
                    },
                  ]}
                  value={formValues.detectorMode}
                  onChange={(event) =>
                    updateFormValue(
                      'detectorMode',
                      event.target.value as MetricsAlertFormValues['detectorMode']
                    )
                  }
                  data-test-subj="metricsAlertsDetectorModeField"
                />
              </EuiFormRow>

              {formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.singleStream && (
                <EuiFormRow
                  label={i18n.translate('explore.metrics.alerts.tab.seriesLabel', {
                    defaultMessage: 'Series',
                  })}
                >
                  <EuiCompressedSelect
                    options={seriesInference.seriesOptions.map((option) => ({
                      value: option.id,
                      text: option.label,
                    }))}
                    value={formValues.selectedSeriesId}
                    onChange={(event) => updateFormValue('selectedSeriesId', event.target.value)}
                    data-test-subj="metricsAlertsSeriesField"
                  />
                </EuiFormRow>
              )}

              {formValues.detectorMode === PROMETHEUS_DETECTOR_MODES.highCardinality && (
                <>
                  <EuiFormRow
                    label={i18n.translate('explore.metrics.alerts.tab.entityFieldLabel', {
                      defaultMessage: 'Entity field',
                    })}
                    helpText={i18n.translate('explore.metrics.alerts.tab.entityFieldHelpText', {
                      defaultMessage:
                        'Prefilled from labels that vary across the currently rendered Prometheus series.',
                    })}
                  >
                    <EuiCompressedSelect
                      options={entityFieldOptions}
                      value={formValues.selectedEntityField}
                      onChange={(event) =>
                        updateFormValue('selectedEntityField', event.target.value)
                      }
                      data-test-subj="metricsAlertsEntityField"
                    />
                  </EuiFormRow>
                  <EuiCallOut
                    size="s"
                    color="primary"
                    iconType="iInCircle"
                    title={i18n.translate(
                      'explore.metrics.alerts.tab.highCardinalityEnabledTitle',
                      {
                        defaultMessage: 'High-cardinality detector',
                      }
                    )}
                  >
                    <p>
                      {i18n.translate('explore.metrics.alerts.tab.highCardinalityEnabledBody', {
                        defaultMessage:
                          'The detector will keep the full PromQL query and use "{entityField}" as the entity field.',
                        values: {
                          entityField: formValues.selectedEntityField,
                        },
                      })}
                    </p>
                  </EuiCallOut>
                  <EuiSpacer size="m" />
                </>
              )}
            </>
          )}

          <EuiFormRow
            label={i18n.translate('explore.metrics.alerts.tab.monitorNameLabel', {
              defaultMessage: 'Monitor name',
            })}
          >
            <EuiCompressedFieldText
              value={formValues.monitorName}
              onChange={(event) => updateFormValue('monitorName', event.target.value)}
              data-test-subj="metricsAlertsMonitorNameField"
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('explore.metrics.alerts.tab.scheduleLabel', {
              defaultMessage: 'Run every',
            })}
          >
            <EuiFlexGroup gutterSize="s" responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiCompressedFieldNumber
                  min={1}
                  step={1}
                  value={
                    Number.isFinite(formValues.scheduleIntervalMinutes)
                      ? formValues.scheduleIntervalMinutes
                      : ''
                  }
                  onChange={(event) =>
                    updateFormValue('scheduleIntervalMinutes', Number(event.target.value || NaN))
                  }
                  data-test-subj="metricsAlertsScheduleIntervalField"
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiCompressedFieldText value="minutes" disabled />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('explore.metrics.alerts.tab.triggerNameLabel', {
              defaultMessage: 'Trigger name',
            })}
          >
            <EuiCompressedFieldText
              value={formValues.triggerName}
              onChange={(event) => updateFormValue('triggerName', event.target.value)}
              data-test-subj="metricsAlertsTriggerNameField"
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('explore.metrics.alerts.tab.severityLabel', {
              defaultMessage: 'Severity',
            })}
          >
            <EuiCompressedSelect
              options={MONITOR_SEVERITY_OPTIONS}
              value={formValues.severity}
              onChange={(event) => updateFormValue('severity', event.target.value)}
              data-test-subj="metricsAlertsSeverityField"
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('explore.metrics.alerts.tab.gradeThresholdLabel', {
              defaultMessage: 'Anomaly grade threshold',
            })}
          >
            <EuiCompressedFieldNumber
              min={0}
              max={1}
              step={0.05}
              value={
                Number.isFinite(formValues.anomalyGradeThreshold)
                  ? formValues.anomalyGradeThreshold
                  : ''
              }
              onChange={(event) =>
                updateFormValue('anomalyGradeThreshold', Number(event.target.value || NaN))
              }
              data-test-subj="metricsAlertsAnomalyGradeField"
            />
          </EuiFormRow>

          <EuiFormRow
            label={i18n.translate('explore.metrics.alerts.tab.confidenceThresholdLabel', {
              defaultMessage: 'Confidence threshold',
            })}
          >
            <EuiCompressedFieldNumber
              min={0}
              max={1}
              step={0.05}
              value={
                Number.isFinite(formValues.anomalyConfidenceThreshold)
                  ? formValues.anomalyConfidenceThreshold
                  : ''
              }
              onChange={(event) =>
                updateFormValue('anomalyConfidenceThreshold', Number(event.target.value || NaN))
              }
              data-test-subj="metricsAlertsConfidenceField"
            />
          </EuiFormRow>

          <EuiText color="subdued" size="xs">
            <p>
              {i18n.translate('explore.metrics.alerts.tab.actionsNote', {
                defaultMessage:
                  'This creates the detector and monitor inline. Notification actions can be added later from the monitor details page.',
              })}
            </p>
          </EuiText>

          <EuiSpacer size="m" />
        </>
      )}

      {createError && !createdMonitor && (
        <>
          <EuiCallOut
            size="s"
            color="danger"
            iconType="alert"
            title={i18n.translate('explore.metrics.alerts.tab.createErrorTitle', {
              defaultMessage: 'Unable to create monitor',
            })}
          >
            <p>{createError}</p>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </>
      )}

      {!createdMonitor && (
        <EuiButton
          size="s"
          fill
          disabled={!isActionAvailable || isCreating || isLoadingExistingAssociation}
          onClick={handleCreateMonitor}
          data-test-subj="metricsCreateAlertMonitorButton"
        >
          {isCreating
            ? i18n.translate('explore.metrics.alerts.tab.creatingMonitorButton', {
                defaultMessage: 'Creating detector and monitor...',
              })
            : i18n.translate('explore.metrics.alerts.tab.createMonitorButton', {
                defaultMessage: 'Create alert monitor',
              })}
        </EuiButton>
      )}
    </div>
  );
};
