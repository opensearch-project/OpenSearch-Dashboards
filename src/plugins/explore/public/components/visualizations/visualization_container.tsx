/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiCallOut,
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiFormRow,
  EuiPanel,
  EuiSpacer,
} from '@elastic/eui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { useDispatch, useSelector } from 'react-redux';
import { i18n } from '@osd/i18n';
import { useObservable } from 'react-use';
import dateMath from '@elastic/datemath';

import { AxisColumnMappings } from './types';
import { useTabResults } from '../../application/utils/hooks/use_tab_results';
import { useSearchContext } from '../query_panel/utils/use_search_context';
import { getVisualizationBuilder } from './visualization_builder';
import { TimeRange } from '../../../../data/common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import {
  clearQueryStatusMap,
  clearResults,
  setDateRange,
} from '../../application/utils/state_management/slices';
import { executeQueries } from '../../application/utils/state_management/actions/query_actions';
import { RootState } from '../../application/utils/state_management/store';
import {
  MAX_AUTO_PREVIEW_SERIES,
  METRICS_ANOMALY_DETECTION_APP_ID,
} from '../../application/utils/metrics_feature_constants';
import { getColors } from './theme/default_colors';

import './visualization_container.scss';

const MAX_PREVIEW_DATAPOINTS = 500;
const MIN_VALID_PREVIEW_DATAPOINTS = 2;
const PROMETHEUS_QUERY_LANGUAGE = 'PROMQL';
const DEFAULT_FORECAST_COLOR = '#FAA43A';
const ANOMALY_PREVIEW_MARKER_SIZE = 10;
const ANOMALY_PREVIEW_COLOR = '#D36086';
const ANOMALY_PREVIEW_BORDER_COLOR = '#8A1538';

interface PreviewPoint {
  ts: number;
  value: number;
}

interface PreviewSeriesOption {
  value: string;
  text: string;
}

interface SeriesPreviewState {
  seriesValue: string;
  points: PreviewPoint[];
  lastObservedTime?: number;
  forecastClampToZero: boolean;
  adPreview: any | null;
  forecastPreview: any | null;
}

const toFiniteNumber = (value: unknown): number | undefined => {
  const normalized = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
};

const downsampleMetricPoints = (points: PreviewPoint[], maxPoints: number): PreviewPoint[] => {
  if (points.length <= maxPoints) {
    return points;
  }

  const step = (points.length - 1) / (maxPoints - 1);
  const sampled = Array.from({ length: maxPoints }, (_, index) => {
    const pointIndex = Math.floor(index * step);
    return points[Math.min(pointIndex, points.length - 1)];
  });

  sampled[sampled.length - 1] = points[points.length - 1];
  return sampled;
};

const setPreviewSeriesOptionsIfChanged = (
  setPreviewSeriesOptions: React.Dispatch<React.SetStateAction<PreviewSeriesOption[]>>,
  nextOptions: PreviewSeriesOption[]
) => {
  setPreviewSeriesOptions((currentOptions) => {
    const isSame =
      currentOptions.length === nextOptions.length &&
      currentOptions.every(
        (currentOption, index) =>
          currentOption.value === nextOptions[index]?.value &&
          currentOption.text === nextOptions[index]?.text
      );
    return isSame ? currentOptions : nextOptions;
  });
};

const areStringArraysEqual = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const setPreviewSelectedSeriesIfChanged = (
  setSelectedPreviewSeriesValues: React.Dispatch<React.SetStateAction<string[]>>,
  nextValues: string[]
) => {
  setSelectedPreviewSeriesValues((currentValues) =>
    areStringArraysEqual(currentValues, nextValues) ? currentValues : nextValues
  );
};

const clearSeriesPreviewStatesIfNeeded = (
  setSeriesPreviewStates: React.Dispatch<React.SetStateAction<SeriesPreviewState[]>>
) => {
  setSeriesPreviewStates((currentStates) => (currentStates.length === 0 ? currentStates : []));
};

const toComboBoxOption = (seriesValue: string): EuiComboBoxOptionOption<string> => ({
  label: seriesValue,
  value: seriesValue,
});

const getColorString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

const getBaseSeriesColor = (series: any): string | undefined =>
  getColorString(series?.lineStyle?.color) ??
  getColorString(series?.itemStyle?.color) ??
  getColorString(series?.color) ??
  getColorString(series?.areaStyle?.color);

const resolveForecastOverlayColor = (
  baseSeries: any[],
  palette: unknown[],
  seriesValue: string,
  previewIndex: number
): string => {
  const fallbackPalette = getColors().categories;
  const matchingSeriesIndex = baseSeries.findIndex(
    (series) => typeof series?.name === 'string' && series.name === seriesValue
  );

  if (matchingSeriesIndex >= 0) {
    return (
      getBaseSeriesColor(baseSeries[matchingSeriesIndex]) ??
      getColorString(palette[matchingSeriesIndex % Math.max(palette.length, 1)]) ??
      getColorString(fallbackPalette[matchingSeriesIndex % Math.max(fallbackPalette.length, 1)]) ??
      DEFAULT_FORECAST_COLOR
    );
  }

  return (
    getColorString(palette[previewIndex % Math.max(palette.length, 1)]) ??
    getColorString(fallbackPalette[previewIndex % Math.max(fallbackPalette.length, 1)]) ??
    DEFAULT_FORECAST_COLOR
  );
};

const extractPreviewErrorMessage = (error: unknown): string => {
  if (!error) {
    return 'Unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  const maybeError = error as any;
  const body = maybeError?.body;
  const bodyErrorReason = body?.error?.reason || body?.error?.details;
  const bodyMessage = body?.message;

  if (typeof bodyErrorReason === 'string' && bodyErrorReason.trim()) {
    return bodyErrorReason;
  }

  if (typeof bodyMessage === 'string' && bodyMessage.trim()) {
    return bodyMessage;
  }

  if (typeof maybeError?.message === 'string' && maybeError.message.trim()) {
    return maybeError.message;
  }

  return 'Unknown error';
};

const formatPreviewFailureMessage = (
  kind: 'anomaly' | 'forecast',
  errorMessage: string
): string => {
  const normalized = errorMessage.trim();
  if (!normalized) {
    return kind === 'anomaly' ? 'Anomaly preview failed.' : 'Forecast preview failed.';
  }

  if (normalized.startsWith('Anomaly preview') || normalized.startsWith('Forecast preview')) {
    return normalized;
  }

  return kind === 'anomaly'
    ? i18n.translate('explore.visualization.prometheusPreview.anomalyFailure', {
        defaultMessage: 'Anomaly preview failed: {error}',
        values: { error: normalized },
      })
    : i18n.translate('explore.visualization.prometheusPreview.forecastFailure', {
        defaultMessage: 'Forecast preview failed: {error}',
        values: { error: normalized },
      });
};

const isMissingAnomalyDetectionDependencyError = (errorMessage: string): boolean => {
  const normalized = errorMessage.trim().toLowerCase();
  return (
    normalized.includes('anomaly detection plugin endpoint not found') ||
    normalized.includes('/_plugins/_anomaly_detection') ||
    normalized.includes('/_opendistro/_anomaly_detection') ||
    normalized.includes('no handler found') ||
    normalized.includes('endpoint not found')
  );
};

export interface UpdateVisualizationProps {
  mappings: AxisColumnMappings;
}

export const VisualizationContainer = React.memo(() => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { results } = useTabResults();
  const query = useSelector((state: RootState) => state.query);
  const queryLanguage = query?.language;
  const queryText = typeof query?.query === 'string' ? query.query : '';
  const dataConnectionId = typeof query?.dataset?.id === 'string' ? query.dataset.id.trim() : '';
  const searchContext = useSearchContext();
  const dispatch = useDispatch();

  const visualizationBuilder = getVisualizationBuilder();
  const visData = useObservable(visualizationBuilder.data$);
  const chartConfig = useObservable(visualizationBuilder.visConfig$);
  const availableApplications = useObservable(
    services.core.application.applications$,
    new Map<string, unknown>()
  ) as ReadonlyMap<string, unknown>;

  const [previewStatusMessage, setPreviewStatusMessage] = useState('');
  const [previewStatusColor, setPreviewStatusColor] = useState<'primary' | 'warning'>('warning');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewSeriesOptions, setPreviewSeriesOptions] = useState<PreviewSeriesOption[]>([]);
  const [selectedPreviewSeriesValues, setSelectedPreviewSeriesValues] = useState<string[]>([]);
  const [seriesPreviewStates, setSeriesPreviewStates] = useState<SeriesPreviewState[]>([]);

  const previewInputSignatureRef = useRef('');
  const isAnomalyDetectionUiAvailable = useMemo(
    () => availableApplications?.has?.(METRICS_ANOMALY_DETECTION_APP_ID) ?? false,
    [availableApplications]
  );

  useEffect(() => {
    if (results) {
      const rows = results.hits?.hits || [];
      const fieldSchema = results.fieldSchema || [];
      visualizationBuilder.handleData(rows, fieldSchema);
    }
  }, [visualizationBuilder, results]);

  useEffect(() => {
    visualizationBuilder.init();
    return () => {
      visualizationBuilder.reset();
    };
  }, [visualizationBuilder]);

  const allVisColumns = useMemo(() => {
    return [
      ...(visData?.numericalColumns ?? []),
      ...(visData?.categoricalColumns ?? []),
      ...(visData?.dateColumns ?? []),
    ];
  }, [visData?.categoricalColumns, visData?.dateColumns, visData?.numericalColumns]);

  const resolveKey = useCallback(
    (preferredName: string | undefined, fallbackMatchers: RegExp[], candidateRows: any[]) => {
      if (preferredName) {
        const column = allVisColumns.find((visColumn) => visColumn.name === preferredName);
        return column?.column ?? preferredName;
      }

      if (allVisColumns.length > 0) {
        const matchedColumn = allVisColumns.find((visColumn) =>
          fallbackMatchers.some((matcher) => matcher.test(visColumn.name))
        );
        if (matchedColumn) {
          return matchedColumn.column;
        }
      }

      const firstRow = candidateRows[0];
      if (!firstRow) {
        return undefined;
      }

      return Object.keys(firstRow).find((key) =>
        fallbackMatchers.some((matcher) => matcher.test(key))
      );
    },
    [allVisColumns]
  );

  const parseTimeRangeToEpoch = useCallback((timeRange?: { from?: string; to?: string }) => {
    const normalizeRelativeNow = (rawValue: string | undefined, parsedValue: number | undefined) =>
      rawValue?.includes('now') && parsedValue !== undefined
        ? Math.floor(parsedValue / 60000) * 60000
        : parsedValue;
    const from = timeRange?.from ? dateMath.parse(timeRange.from)?.valueOf() : undefined;
    const to = timeRange?.to
      ? dateMath.parse(timeRange.to, { roundUp: true })?.valueOf()
      : undefined;
    return {
      from: normalizeRelativeNow(timeRange?.from, from),
      to: normalizeRelativeNow(timeRange?.to, to),
    };
  }, []);

  useEffect(() => {
    const promqlQuery = queryLanguage === PROMETHEUS_QUERY_LANGUAGE ? queryText.trim() : '';

    const resetPreviewState = () => {
      previewInputSignatureRef.current = '';
      clearSeriesPreviewStatesIfNeeded(setSeriesPreviewStates);
      setPreviewSeriesOptionsIfChanged(setPreviewSeriesOptions, []);
      setPreviewSelectedSeriesIfChanged(setSelectedPreviewSeriesValues, []);
      setPreviewStatusMessage('');
      setPreviewStatusColor('warning');
      setPreviewLoading(false);
    };

    if (!isAnomalyDetectionUiAvailable) {
      resetPreviewState();
      return;
    }

    if (!promqlQuery) {
      resetPreviewState();
      return;
    }

    const candidateRows: Array<Record<string, any>> = Array.isArray(visData?.transformedData)
      ? (visData.transformedData as Array<Record<string, any>>)
      : Array.isArray((results as any)?.instantHits?.hits)
      ? (results as any).instantHits.hits.map((hit: any) => hit?._source).filter(Boolean)
      : Array.isArray((results as any)?.hits?.hits)
      ? (results as any).hits.hits.map((hit: any) => hit?._source).filter(Boolean)
      : [];

    if (candidateRows.length === 0) {
      setPreviewSeriesOptionsIfChanged(setPreviewSeriesOptions, []);
      setPreviewSelectedSeriesIfChanged(setSelectedPreviewSeriesValues, []);
      resetPreviewState();
      return;
    }

    const axesMapping = chartConfig?.axesMapping ?? {};
    const effectiveTimeKey = resolveKey(
      axesMapping.x,
      [/^time$/i, /timestamp/i, /@timestamp/i],
      candidateRows
    );
    const effectiveValueKey = resolveKey(
      axesMapping.y,
      [/^value$/i, /^value #/i, /val/i],
      candidateRows
    );
    const effectiveSeriesKey = resolveKey(
      axesMapping.color,
      [/^series$/i, /^metric$/i, /label/i],
      candidateRows
    );

    if (!effectiveTimeKey || !effectiveValueKey) {
      setPreviewSeriesOptionsIfChanged(setPreviewSeriesOptions, []);
      setPreviewSelectedSeriesIfChanged(setSelectedPreviewSeriesValues, []);
      resetPreviewState();
      return;
    }

    const seriesValues = effectiveSeriesKey
      ? Array.from(
          new Set(
            candidateRows
              .map((row) =>
                row?.[effectiveSeriesKey] == null ? '' : String(row[effectiveSeriesKey])
              )
              .filter((seriesValue) => seriesValue.trim() !== '')
          )
        )
      : [];

    const nextSeriesOptions = seriesValues.map((seriesValue) => ({
      value: seriesValue,
      text: seriesValue,
    }));
    setPreviewSeriesOptionsIfChanged(setPreviewSeriesOptions, nextSeriesOptions);

    const shouldAutoPreviewAllSeries =
      seriesValues.length > 0 && seriesValues.length <= MAX_AUTO_PREVIEW_SERIES;
    const validSelectedSeriesValues = selectedPreviewSeriesValues
      .filter((seriesValue) => seriesValues.includes(seriesValue))
      .slice(0, MAX_AUTO_PREVIEW_SERIES);

    if (!shouldAutoPreviewAllSeries) {
      setPreviewSelectedSeriesIfChanged(setSelectedPreviewSeriesValues, validSelectedSeriesValues);
    }

    const seriesValuesToPreview = effectiveSeriesKey
      ? seriesValues.length === 0
        ? ['']
        : shouldAutoPreviewAllSeries
        ? seriesValues
        : validSelectedSeriesValues
      : [''];

    if (seriesValues.length > MAX_AUTO_PREVIEW_SERIES && seriesValuesToPreview.length === 0) {
      previewInputSignatureRef.current = '';
      clearSeriesPreviewStatesIfNeeded(setSeriesPreviewStates);
      setPreviewStatusColor('primary');
      setPreviewStatusMessage(
        i18n.translate('explore.visualization.prometheusPreview.selectSeriesMessage', {
          defaultMessage:
            'This query returns {seriesCount} series. Select up to {maxSeries} series to generate preview overlays.',
          values: {
            seriesCount: seriesValues.length,
            maxSeries: MAX_AUTO_PREVIEW_SERIES,
          },
        })
      );
      setPreviewLoading(false);
      return;
    }

    const { from, to } = parseTimeRangeToEpoch(searchContext?.timeRange);
    const previewInputs = seriesValuesToPreview.map((seriesValue) => {
      const validPoints = candidateRows
        .filter((row) =>
          effectiveSeriesKey && seriesValue
            ? String(row?.[effectiveSeriesKey]) === seriesValue
            : true
        )
        .map((row) => {
          const rawTimestamp = row?.[effectiveTimeKey];
          const rawValue = row?.[effectiveValueKey];
          const timestamp =
            typeof rawTimestamp === 'number'
              ? rawTimestamp
              : rawTimestamp
              ? new Date(String(rawTimestamp)).getTime()
              : NaN;
          const value =
            typeof rawValue === 'number' ? rawValue : rawValue != null ? Number(rawValue) : NaN;
          return { ts: timestamp, value };
        })
        .filter(
          (point): point is PreviewPoint =>
            Number.isFinite(point.ts) && Number.isFinite(point.value)
        )
        .sort((left, right) => left.ts - right.ts);

      const sampledPoints = downsampleMetricPoints(validPoints, MAX_PREVIEW_DATAPOINTS);
      const periodStart = from ?? sampledPoints[0]?.ts;
      const periodEnd = to ?? sampledPoints[sampledPoints.length - 1]?.ts;
      const minObserved = sampledPoints.reduce(
        (currentMin, point) => (point.value < currentMin ? point.value : currentMin),
        Number.POSITIVE_INFINITY
      );

      return {
        seriesValue,
        validPoints,
        sampledPoints,
        periodStart,
        periodEnd,
        forecastClampToZero: Number.isFinite(minObserved) && minObserved >= 0,
        lastObservedTime: sampledPoints[sampledPoints.length - 1]?.ts,
      };
    });

    const usablePreviewInputs = previewInputs.filter(
      (previewInput) =>
        previewInput.validPoints.length >= MIN_VALID_PREVIEW_DATAPOINTS &&
        previewInput.periodStart !== undefined &&
        previewInput.periodEnd !== undefined &&
        previewInput.periodStart < previewInput.periodEnd
    );

    if (usablePreviewInputs.length === 0) {
      setSeriesPreviewStates(
        previewInputs.map((previewInput) => ({
          seriesValue: previewInput.seriesValue,
          points: previewInput.validPoints,
          lastObservedTime: previewInput.lastObservedTime,
          forecastClampToZero: previewInput.forecastClampToZero,
          adPreview: null,
          forecastPreview: null,
        }))
      );
      setPreviewStatusMessage(
        i18n.translate('explore.visualization.prometheusPreview.notEnoughUsableDatapointsMessage', {
          defaultMessage:
            'Preview requires at least {minPoints} valid numeric datapoints with a usable time range. Current metric has {actualPoints}.',
          values: {
            minPoints: MIN_VALID_PREVIEW_DATAPOINTS,
            actualPoints: Math.max(
              0,
              ...previewInputs.map((previewInput) => previewInput.validPoints.length)
            ),
          },
        })
      );
      setPreviewStatusColor('warning');
      setPreviewLoading(false);
      return;
    }

    const previewInputSignature = [
      queryLanguage ?? '',
      promqlQuery,
      dataConnectionId,
      usablePreviewInputs
        .map(
          (previewInput) =>
            `${previewInput.seriesValue}:${previewInput.sampledPoints.length}:${
              previewInput.periodStart
            }:${previewInput.periodEnd}:${previewInput.sampledPoints[0]?.ts ?? ''}:${
              previewInput.sampledPoints[previewInput.sampledPoints.length - 1]?.ts ?? ''
            }`
        )
        .join('||'),
    ].join('|');

    if (previewInputSignatureRef.current === previewInputSignature) {
      return;
    }
    previewInputSignatureRef.current = previewInputSignature;

    let didCancel = false;

    const executePreview = async () => {
      setPreviewLoading(true);
      setPreviewStatusMessage('');
      setPreviewStatusColor('warning');
      clearSeriesPreviewStatesIfNeeded(setSeriesPreviewStates);

      try {
        const seriesResults = await Promise.all(
          usablePreviewInputs.map(async (previewInput) => {
            const [anomalyPreviewResult, forecastPreviewResult] = await Promise.allSettled([
              services.http.post('/api/explore/anomaly_preview', {
                body: JSON.stringify({
                  points: previewInput.sampledPoints,
                  startTime: previewInput.periodStart,
                  endTime: previewInput.periodEnd,
                  shingleSize: 8,
                  promqlQuery,
                  dataConnectionId,
                  seriesValue: previewInput.seriesValue,
                }),
              }),
              services.http.post('/api/explore/forecast_preview', {
                body: JSON.stringify({
                  points: previewInput.sampledPoints,
                  startTime: previewInput.periodStart,
                  endTime: previewInput.periodEnd,
                  shingleSize: 8,
                  promqlQuery,
                  dataConnectionId,
                  seriesValue: previewInput.seriesValue,
                }),
              }),
            ]);

            return {
              previewInput,
              anomalyPreviewResult,
              forecastPreviewResult,
            };
          })
        );

        if (didCancel) {
          return;
        }

        const anomalyDependencyMissingForAllSeries = seriesResults.every(
          ({ anomalyPreviewResult }) => {
            if (anomalyPreviewResult.status === 'fulfilled') {
              return (
                anomalyPreviewResult.value?.ok !== true &&
                isMissingAnomalyDetectionDependencyError(
                  String(
                    anomalyPreviewResult.value?.error || anomalyPreviewResult.value?.message || ''
                  )
                )
              );
            }

            return isMissingAnomalyDetectionDependencyError(
              extractPreviewErrorMessage(anomalyPreviewResult.reason)
            );
          }
        );

        if (anomalyDependencyMissingForAllSeries) {
          previewInputSignatureRef.current = '';
          clearSeriesPreviewStatesIfNeeded(setSeriesPreviewStates);
          setPreviewStatusMessage('');
          setPreviewStatusColor('warning');
          setPreviewLoading(false);
          return;
        }

        const previewErrors: string[] = [];
        let emptyAnomalyPreviewCount = 0;
        let noPositiveAnomalyCount = 0;
        let successfulAnomalyPreviewCount = 0;

        const nextSeriesPreviewStates = seriesResults.map(
          ({ previewInput, anomalyPreviewResult, forecastPreviewResult }) => {
            let adPreview: any | null = null;
            let forecastPreview: any | null = null;
            const seriesPrefix = previewInput.seriesValue ? `${previewInput.seriesValue}: ` : '';

            if (anomalyPreviewResult.status === 'fulfilled') {
              if (anomalyPreviewResult.value?.ok) {
                adPreview = anomalyPreviewResult.value;
                successfulAnomalyPreviewCount += 1;
                const anomalyMeta = anomalyPreviewResult.value?.meta;
                const anomalyResultCount = toFiniteNumber(anomalyMeta?.anomalyResultCount) ?? 0;
                const positiveAnomalyCount = toFiniteNumber(anomalyMeta?.positiveAnomalyCount) ?? 0;
                if (anomalyResultCount === 0) {
                  emptyAnomalyPreviewCount += 1;
                } else if (positiveAnomalyCount === 0) {
                  noPositiveAnomalyCount += 1;
                }
              } else {
                previewErrors.push(
                  `${seriesPrefix}${formatPreviewFailureMessage(
                    'anomaly',
                    anomalyPreviewResult.value?.error ||
                      anomalyPreviewResult.value?.message ||
                      'Unknown error'
                  )}`
                );
              }
            } else {
              previewErrors.push(
                `${seriesPrefix}${formatPreviewFailureMessage(
                  'anomaly',
                  extractPreviewErrorMessage(anomalyPreviewResult.reason)
                )}`
              );
            }

            if (forecastPreviewResult.status === 'fulfilled') {
              if (forecastPreviewResult.value?.ok) {
                forecastPreview = forecastPreviewResult.value;
              } else {
                previewErrors.push(
                  `${seriesPrefix}${formatPreviewFailureMessage(
                    'forecast',
                    forecastPreviewResult.value?.error ||
                      forecastPreviewResult.value?.message ||
                      'Unknown error'
                  )}`
                );
              }
            } else {
              previewErrors.push(
                `${seriesPrefix}${formatPreviewFailureMessage(
                  'forecast',
                  extractPreviewErrorMessage(forecastPreviewResult.reason)
                )}`
              );
            }

            return {
              seriesValue: previewInput.seriesValue,
              points: previewInput.validPoints,
              lastObservedTime: previewInput.lastObservedTime,
              forecastClampToZero: previewInput.forecastClampToZero,
              adPreview,
              forecastPreview,
            };
          }
        );

        setSeriesPreviewStates(nextSeriesPreviewStates);

        const previewInfoMessages: string[] = [];
        if (
          successfulAnomalyPreviewCount > 0 &&
          emptyAnomalyPreviewCount === successfulAnomalyPreviewCount
        ) {
          previewInfoMessages.push(
            i18n.translate(
              'explore.visualization.prometheusPreview.anomalyEmptyPreviewRowsMessage',
              {
                defaultMessage:
                  'Anomaly preview did not return any preview rows for this metric and time range. This is different from "no anomalies found"; it usually means preview could not produce usable anomaly samples.',
              }
            )
          );
        } else if (
          successfulAnomalyPreviewCount > 0 &&
          noPositiveAnomalyCount === successfulAnomalyPreviewCount
        ) {
          previewInfoMessages.push(
            i18n.translate(
              'explore.visualization.prometheusPreview.anomalyNoPositiveResultsMessage',
              {
                defaultMessage:
                  'Anomaly preview ran successfully but did not detect positive anomalies in the sampled preview data for this metric and time range.',
              }
            )
          );
        }

        if (previewErrors.length > 0) {
          setPreviewStatusColor('warning');
          setPreviewStatusMessage([...previewErrors, ...previewInfoMessages].join('\n'));
        } else if (previewInfoMessages.length > 0) {
          setPreviewStatusColor('primary');
          setPreviewStatusMessage(previewInfoMessages.join('\n'));
        }
      } catch (error) {
        if (!didCancel) {
          setPreviewStatusColor('warning');
          setPreviewStatusMessage(
            i18n.translate('explore.visualization.prometheusPreview.failedMessage', {
              defaultMessage: 'Unable to load preview overlays: {error}',
              values: {
                error: extractPreviewErrorMessage(error),
              },
            })
          );
        }
      } finally {
        if (!didCancel) {
          setPreviewLoading(false);
        }
      }
    };

    executePreview();

    return () => {
      didCancel = true;
    };
  }, [
    chartConfig?.axesMapping,
    parseTimeRangeToEpoch,
    queryLanguage,
    queryText,
    resolveKey,
    results,
    searchContext?.timeRange,
    services.http,
    dataConnectionId,
    isAnomalyDetectionUiAvailable,
    selectedPreviewSeriesValues,
    visData?.transformedData,
  ]);

  const augmentEchartsSpec = useCallback(
    (spec: any, _ctx: { timeRange: TimeRange }) => {
      if (!spec || Array.isArray(spec.grid)) {
        return spec;
      }

      const xAxes = Array.isArray(spec.xAxis) ? spec.xAxis : [spec.xAxis ?? { type: 'time' }];
      const yAxes = Array.isArray(spec.yAxis) ? spec.yAxis : [spec.yAxis ?? { type: 'value' }];
      const baseGrid = spec.grid && typeof spec.grid === 'object' ? spec.grid : {};
      const baseSeries = Array.isArray(spec.series) ? spec.series : [];
      const basePalette = Array.isArray(spec.color) ? spec.color : [];

      const augmented: any = {
        ...spec,
        grid: {
          ...baseGrid,
          left: baseGrid.left ?? 40,
          right: baseGrid.right ?? 30,
        },
        legend: Array.isArray(spec.legend)
          ? spec.legend.map((legend: any) =>
              legend && typeof legend === 'object'
                ? {
                    ...legend,
                    itemWidth: ANOMALY_PREVIEW_MARKER_SIZE,
                    itemHeight: ANOMALY_PREVIEW_MARKER_SIZE,
                  }
                : legend
            )
          : spec.legend && typeof spec.legend === 'object'
          ? {
              ...spec.legend,
              itemWidth: ANOMALY_PREVIEW_MARKER_SIZE,
              itemHeight: ANOMALY_PREVIEW_MARKER_SIZE,
            }
          : spec.legend,
        xAxis: xAxes,
        yAxis: [...yAxes],
        tooltip: spec.tooltip,
        series: [...baseSeries],
      };

      seriesPreviewStates.forEach((previewState, previewIndex) => {
        const forecastPreview = previewState.forecastPreview;
        if (forecastPreview?.ok === true && Array.isArray(forecastPreview?.response?.points)) {
          const forecastSeriesSuffix = previewState.seriesValue
            ? ` (${previewState.seriesValue})`
            : '';
          const forecastColor = resolveForecastOverlayColor(
            baseSeries,
            basePalette,
            previewState.seriesValue,
            previewIndex
          );
          const futureCutoff = previewState.lastObservedTime ?? Number.NEGATIVE_INFINITY;
          const forecastPoints = (forecastPreview.response.points as any[])
            .map((point) => {
              const t = toFiniteNumber(point?.t);
              const v = toFiniteNumber(point?.v);
              const lo = toFiniteNumber(point?.lo);
              const hi = toFiniteNumber(point?.hi);
              if (t === undefined || v === undefined || t <= futureCutoff) {
                return null;
              }

              const forecastValue = previewState.forecastClampToZero ? Math.max(0, v) : v;
              const lowerBound =
                lo === undefined
                  ? undefined
                  : previewState.forecastClampToZero
                  ? Math.max(0, lo)
                  : lo;
              const upperBound = hi;
              if (forecastValue === undefined) {
                return null;
              }

              return {
                t,
                v: forecastValue,
                lo:
                  lowerBound !== undefined && upperBound !== undefined
                    ? Math.min(lowerBound, upperBound)
                    : lowerBound,
                hi:
                  lowerBound !== undefined && upperBound !== undefined
                    ? Math.max(lowerBound, upperBound)
                    : upperBound,
              };
            })
            .filter(Boolean);

          if (forecastPoints.length > 0) {
            const dataForecast = forecastPoints.map((point: any) => [point.t, point.v]);
            const dataLower = forecastPoints.map((point: any) => [
              point.t,
              Number.isFinite(point.lo) ? point.lo : point.v,
            ]);
            const dataUpperMinusLower = forecastPoints.map((point: any) => {
              const lower = Number.isFinite(point.lo) ? point.lo : point.v;
              const upper = Number.isFinite(point.hi) ? point.hi : point.v;
              return [point.t, Math.max(0, upper - lower)];
            });

            augmented.series.push(
              {
                name: `Forecast lower${forecastSeriesSuffix}`,
                type: 'line',
                xAxisIndex: 0,
                yAxisIndex: 0,
                data: dataLower,
                stack: `forecastBand${forecastSeriesSuffix}`,
                symbol: 'none',
                lineStyle: { opacity: 0 },
                tooltip: { show: false },
                z: 2,
              },
              {
                name: `Forecast band${forecastSeriesSuffix}`,
                type: 'line',
                xAxisIndex: 0,
                yAxisIndex: 0,
                data: dataUpperMinusLower,
                stack: `forecastBand${forecastSeriesSuffix}`,
                symbol: 'none',
                lineStyle: { opacity: 0 },
                areaStyle: { color: forecastColor, opacity: 0.18 },
                tooltip: { show: false },
                z: 2,
              },
              {
                name: `Forecast${forecastSeriesSuffix}`,
                type: 'line',
                xAxisIndex: 0,
                yAxisIndex: 0,
                data: dataForecast,
                symbol: 'none',
                lineStyle: { width: 2, type: 'dashed', color: forecastColor },
                z: 3,
              }
            );
          }
        }

        const adPreview = previewState.adPreview;
        if (adPreview?.ok === true) {
          const anomalies =
            adPreview?.response?.anomaly_result ?? adPreview?.response?.anomalies ?? [];
          const observedPoints = previewState.points;
          const markerBaselineValue =
            observedPoints.length > 0
              ? observedPoints.reduce(
                  (currentMin, point) => (point.value < currentMin ? point.value : currentMin),
                  Number.POSITIVE_INFINITY
                )
              : Number.NaN;
          const resolveObservedValue = (timestamp: number) => {
            if (!Number.isFinite(timestamp) || observedPoints.length === 0) {
              return undefined;
            }

            if (observedPoints.length === 1) {
              return observedPoints[0].value;
            }

            const firstPoint = observedPoints[0];
            const lastPoint = observedPoints[observedPoints.length - 1];
            if (timestamp <= firstPoint.ts) {
              return firstPoint.value;
            }
            if (timestamp >= lastPoint.ts) {
              return lastPoint.value;
            }

            let left = 0;
            let right = observedPoints.length - 1;
            while (left < right) {
              const mid = Math.floor((left + right) / 2);
              if (observedPoints[mid].ts < timestamp) {
                left = mid + 1;
              } else {
                right = mid;
              }
            }

            const candidates = [observedPoints[left], observedPoints[left - 1]].filter(
              (point): point is PreviewPoint => point != null
            );
            if (candidates.length === 0) {
              return undefined;
            }

            const rightPoint = candidates.find((point) => point.ts >= timestamp);
            const leftPoint =
              [...candidates].reverse().find((point) => point.ts <= timestamp) ?? candidates[0];

            if (leftPoint && rightPoint && leftPoint.ts !== rightPoint.ts) {
              const ratio = (timestamp - leftPoint.ts) / (rightPoint.ts - leftPoint.ts);
              return leftPoint.value + (rightPoint.value - leftPoint.value) * ratio;
            }

            const nearestPoint = candidates.reduce((best, point) => {
              if (!best) return point;
              return Math.abs(point.ts - timestamp) < Math.abs(best.ts - timestamp) ? point : best;
            }, undefined as PreviewPoint | undefined);

            return nearestPoint?.value;
          };

          const markerData = (Array.isArray(anomalies) ? anomalies : [])
            .map((anomaly: any) => {
              const time =
                toFiniteNumber(anomaly?.data_end_time) ?? toFiniteNumber(anomaly?.data_start_time);
              const anomalyGrade = toFiniteNumber(anomaly?.anomaly_grade) ?? 0;
              const confidence = toFiniteNumber(anomaly?.confidence) ?? 0;
              const observedValue = time === undefined ? undefined : resolveObservedValue(time);
              const markerYValue = Number.isFinite(markerBaselineValue)
                ? markerBaselineValue
                : observedValue;
              if (time === undefined || anomalyGrade <= 0 || observedValue === undefined) {
                return null;
              }
              return {
                value: [time, markerYValue],
                anomaly_grade: anomalyGrade,
                confidence,
                observed_value: observedValue,
              };
            })
            .filter(Boolean);

          if (markerData.length > 0) {
            const anomalySeriesSuffix = previewState.seriesValue
              ? ` (${previewState.seriesValue})`
              : '';
            augmented.series.push({
              name: `Anomalies (preview)${anomalySeriesSuffix}`,
              type: 'scatter',
              xAxisIndex: 0,
              yAxisIndex: 0,
              symbol: 'triangle',
              legendIcon: 'triangle',
              symbolOffset: [0, '135%'],
              itemStyle: {
                color: ANOMALY_PREVIEW_COLOR,
                borderColor: ANOMALY_PREVIEW_COLOR,
                borderWidth: 1,
                opacity: 1,
              },
              clip: false,
              z: 10,
              data: markerData,
              symbolSize: ANOMALY_PREVIEW_MARKER_SIZE,
              markLine: {
                silent: true,
                symbol: 'none',
                label: { show: false },
                lineStyle: {
                  color: 'rgba(211, 96, 134, 0.38)',
                  width: 1.5,
                  type: 'dashed',
                },
                data: markerData.map((marker: any) => ({ xAxis: marker?.value?.[0] })),
              },
              emphasis: {
                scale: false,
                itemStyle: {
                  color: ANOMALY_PREVIEW_COLOR,
                  borderColor: ANOMALY_PREVIEW_BORDER_COLOR,
                  borderWidth: 1.5,
                  shadowBlur: 6,
                  shadowColor: 'rgba(211, 96, 134, 0.35)',
                },
              },
              tooltip: {
                trigger: 'item',
                formatter: (point: any) => {
                  const timestamp = point?.data?.value?.[0];
                  const anomalyGrade = point?.data?.anomaly_grade ?? 0;
                  const confidence = point?.data?.confidence ?? 0;
                  const observedValue = point?.data?.observed_value;
                  const timeLabel =
                    typeof timestamp === 'number' && Number.isFinite(timestamp)
                      ? moment(timestamp).format('YYYY-MM-DD HH:mm:ss')
                      : 'Unknown time';
                  return `${timeLabel}<br/>Anomaly grade: ${
                    Number(anomalyGrade).toFixed?.(2) ?? anomalyGrade
                  }<br/>Confidence: ${Number(confidence).toFixed?.(2) ?? confidence}<br/>Value: ${
                    Number.isFinite(observedValue) ? Number(observedValue).toFixed(4) : 'N/A'
                  }`;
                },
              },
            });
          }
        }
      });

      return augmented;
    },
    [seriesPreviewStates]
  );

  const onSelectTimeRange = useCallback(
    (timeRange?: TimeRange) => {
      if (timeRange) {
        dispatch(
          setDateRange({
            from: moment(timeRange.from).toISOString(),
            to: moment(timeRange.to).toISOString(),
          })
        );
        dispatch(clearResults());
        dispatch(clearQueryStatusMap());
        // @ts-expect-error TS2345 TODO(ts-error): fixme
        dispatch(executeQueries({ services }));
      }
    },
    [services, dispatch]
  );

  const previewSeriesComboOptions = useMemo(
    () => previewSeriesOptions.map((option) => toComboBoxOption(option.value)),
    [previewSeriesOptions]
  );

  const selectedPreviewSeriesComboOptions = useMemo(
    () =>
      selectedPreviewSeriesValues
        .filter((seriesValue) =>
          previewSeriesOptions.some((option) => option.value === seriesValue)
        )
        .map(toComboBoxOption),
    [previewSeriesOptions, selectedPreviewSeriesValues]
  );

  return (
    <div className="exploreVisContainer">
      {isAnomalyDetectionUiAvailable && (previewLoading || previewStatusMessage) ? (
        <>
          <EuiCallOut
            size="s"
            title={
              previewLoading
                ? i18n.translate('explore.visualization.prometheusPreview.loadingTitle', {
                    defaultMessage: 'Loading preview overlays',
                  })
                : i18n.translate('explore.visualization.prometheusPreview.statusTitle', {
                    defaultMessage: 'Preview overlay status',
                  })
            }
            color={previewLoading ? 'primary' : previewStatusColor}
            iconType={previewLoading ? 'refresh' : 'alert'}
            data-test-subj="metricsPreviewStatusCallout"
            className="exploreVisPreviewBanner"
          >
            <p style={{ whiteSpace: 'pre-line' }}>
              {previewLoading
                ? i18n.translate('explore.visualization.prometheusPreview.loadingMessage', {
                    defaultMessage:
                      'Generating anomaly and forecast previews from the latest metric datapoints.',
                  })
                : previewStatusMessage}
            </p>
          </EuiCallOut>
          <EuiSpacer size="s" />
        </>
      ) : null}
      {isAnomalyDetectionUiAvailable && previewSeriesOptions.length > MAX_AUTO_PREVIEW_SERIES ? (
        <>
          <EuiFormRow
            label={i18n.translate(
              'explore.visualization.prometheusPreview.previewSeriesSelectorLabel',
              {
                defaultMessage: 'Preview overlays for series',
              }
            )}
            helpText={i18n.translate(
              'explore.visualization.prometheusPreview.previewSeriesSelectorHelpText',
              {
                defaultMessage:
                  'Select up to {maxSeries} series. Smaller multi-series charts preview all series automatically.',
                values: {
                  maxSeries: MAX_AUTO_PREVIEW_SERIES,
                },
              }
            )}
            display="rowCompressed"
          >
            <EuiComboBox
              compressed
              fullWidth
              placeholder={i18n.translate(
                'explore.visualization.prometheusPreview.previewSeriesSelectorPlaceholder',
                {
                  defaultMessage: 'Select series to preview',
                }
              )}
              options={previewSeriesComboOptions}
              selectedOptions={selectedPreviewSeriesComboOptions}
              onChange={(selectedOptions) =>
                setPreviewSelectedSeriesIfChanged(
                  setSelectedPreviewSeriesValues,
                  selectedOptions
                    .map((option) => option.value || option.label)
                    .slice(0, MAX_AUTO_PREVIEW_SERIES)
                )
              }
              data-test-subj="metricsPreviewSeriesSelector"
            />
          </EuiFormRow>
          <EuiSpacer size="s" />
        </>
      ) : null}
      <EuiPanel
        hasBorder={false}
        hasShadow={false}
        data-test-subj="exploreVisualizationLoader"
        className="exploreVisPanel"
        paddingSize="none"
      >
        <div className="exploreVisPanel__inner">
          {visualizationBuilder.renderVisualization({
            timeRange: searchContext?.timeRange,
            onSelectTimeRange,
            augmentEchartsSpec,
          })}
        </div>
      </EuiPanel>
    </div>
  );
});
