/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PROMETHEUS_DETECTOR_MODES,
  PrometheusDetectorMode,
} from '../../../../utils/metrics_feature_constants';

const DEFAULT_MONITOR_INTERVAL_MINUTES = 1;
const DEFAULT_ANOMALY_THRESHOLD = 0.7;
const DEFAULT_TRIGGER_SEVERITY = '1';
const DEFAULT_AD_RESULT_INDEX = '.opendistro-anomaly-results*';

const PROMQL_RANGE_SELECTOR_REGEX = /\[\s*([^\]:]+?)\s*(?::[^\]]*)?\]/;
const PROMQL_DURATION_SEGMENT_REGEX = /(\d+(?:\.\d+)?)(ms|s|m|h|d|w|y)/g;

const DURATION_UNIT_SECONDS: Record<string, number> = {
  ms: 0.001,
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
  y: 31536000,
};

const PROMQL_RESERVED_WORDS = new Set([
  'bool',
  'by',
  'without',
  'on',
  'ignoring',
  'group_left',
  'group_right',
  'and',
  'or',
  'unless',
  'sum',
  'avg',
  'min',
  'max',
  'count',
  'stddev',
  'stdvar',
  'topk',
  'bottomk',
  'quantile',
  'rate',
  'irate',
  'increase',
  'delta',
  'idelta',
]);

export interface MetricsAlertFormValues {
  monitorName: string;
  scheduleIntervalMinutes: number;
  triggerName: string;
  severity: string;
  anomalyGradeThreshold: number;
  anomalyConfidenceThreshold: number;
  detectorMode: PrometheusDetectorMode;
  selectedSeriesId: string;
  selectedEntityField: string;
}

export interface MetricsAlertMonitorMetadata {
  detectorId: string;
  detectorName: string;
  promqlQuery: string;
  dataConnectionId: string;
  dataSourceId?: string;
  detectorMode?: PrometheusDetectorMode;
  selectedSeriesId?: string;
  selectedEntityField?: string;
  selectedSeriesLabels?: Record<string, string>;
}

const sanitizeNamePart = (rawName: string): string =>
  (rawName || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

const parsePromqlDurationToSeconds = (durationText: string): number | undefined => {
  const trimmed = (durationText || '').trim();
  if (!trimmed) {
    return undefined;
  }

  let totalSeconds = 0;
  let matchedLength = 0;
  PROMQL_DURATION_SEGMENT_REGEX.lastIndex = 0;
  let matchedSegment = PROMQL_DURATION_SEGMENT_REGEX.exec(trimmed);

  while (matchedSegment) {
    if (matchedSegment.index !== matchedLength) {
      return undefined;
    }

    const value = Number(matchedSegment[1]);
    const unit = matchedSegment[2];
    if (!Number.isFinite(value) || !DURATION_UNIT_SECONDS[unit]) {
      return undefined;
    }

    totalSeconds += value * DURATION_UNIT_SECONDS[unit];
    matchedLength += matchedSegment[0].length;
    matchedSegment = PROMQL_DURATION_SEGMENT_REGEX.exec(trimmed);
  }

  if (matchedLength !== trimmed.length || totalSeconds <= 0) {
    return undefined;
  }

  return totalSeconds;
};

export const extractPromqlMetricName = (queryText: string): string | undefined => {
  const query = (queryText || '').trim();
  if (!query) {
    return undefined;
  }

  const metricSelectorRegex = /([a-zA-Z_:][a-zA-Z0-9_:]*)\s*(?=\{|\[)/;
  const selectorMatch = metricSelectorRegex.exec(query);
  if (selectorMatch && selectorMatch[1]) {
    return selectorMatch[1];
  }

  const tokenRegex = /\b([a-zA-Z_:][a-zA-Z0-9_:]*)\b/g;
  let tokenMatch = tokenRegex.exec(query);
  while (tokenMatch) {
    const token = tokenMatch[1];
    const nextChar = query.slice(tokenMatch.index + token.length).trimStart()[0];
    const isFunction = nextChar === '(';
    if (!isFunction && !PROMQL_RESERVED_WORDS.has(token.toLowerCase())) {
      return token;
    }
    tokenMatch = tokenRegex.exec(query);
  }

  return undefined;
};

export const getPromqlRangeIntervalMinutes = (queryText: string): number | undefined => {
  const match = PROMQL_RANGE_SELECTOR_REGEX.exec(queryText || '');
  if (!match || !match[1]) {
    return undefined;
  }

  const durationSeconds = parsePromqlDurationToSeconds(match[1]);
  if (!durationSeconds || durationSeconds <= 0) {
    return undefined;
  }

  return Math.max(1, Math.ceil(durationSeconds / 60));
};

export const toMonitorIntervalMinutes = (detectionInterval: any): number => {
  const period = detectionInterval?.period ?? detectionInterval;
  const interval = Number(period?.interval);
  const rawUnit = String(period?.unit || '').toLowerCase();

  if (!Number.isFinite(interval) || interval <= 0) {
    return DEFAULT_MONITOR_INTERVAL_MINUTES;
  }

  if (rawUnit.startsWith('second')) {
    return Math.max(1, Math.ceil(interval / 60));
  }
  if (rawUnit.startsWith('hour')) {
    return Math.max(1, Math.round(interval * 60));
  }
  if (rawUnit.startsWith('day')) {
    return Math.max(1, Math.round(interval * 24 * 60));
  }

  return Math.max(1, Math.round(interval));
};

export const buildDefaultMetricsAlertFormValues = (
  promqlQuery: string,
  detectorDefaults?: {
    detectorMode?: PrometheusDetectorMode;
    selectedSeriesId?: string;
    selectedEntityField?: string;
  }
): MetricsAlertFormValues => {
  const metricName = extractPromqlMetricName(promqlQuery);
  const compactMetricName = sanitizeNamePart(metricName || 'promql');
  const suffix = Date.now().toString(36).slice(-4);
  const monitorBase = compactMetricName || 'promql';

  return {
    monitorName: `metrics-${monitorBase}-monitor-${suffix}`,
    scheduleIntervalMinutes:
      getPromqlRangeIntervalMinutes(promqlQuery) || DEFAULT_MONITOR_INTERVAL_MINUTES,
    triggerName: `${monitorBase}-anomaly-trigger`,
    severity: DEFAULT_TRIGGER_SEVERITY,
    anomalyGradeThreshold: DEFAULT_ANOMALY_THRESHOLD,
    anomalyConfidenceThreshold: DEFAULT_ANOMALY_THRESHOLD,
    detectorMode: detectorDefaults?.detectorMode || PROMETHEUS_DETECTOR_MODES.singleStream,
    selectedSeriesId: detectorDefaults?.selectedSeriesId || '',
    selectedEntityField: detectorDefaults?.selectedEntityField || '',
  };
};

export const validateMetricsAlertFormValues = (
  values: MetricsAlertFormValues
): string | undefined => {
  if (!values.monitorName.trim()) {
    return 'Monitor name is required.';
  }
  if (!values.triggerName.trim()) {
    return 'Trigger name is required.';
  }
  if (!Number.isFinite(values.scheduleIntervalMinutes) || values.scheduleIntervalMinutes <= 0) {
    return 'Monitor schedule must be a positive number of minutes.';
  }
  if (
    !Number.isFinite(values.anomalyGradeThreshold) ||
    values.anomalyGradeThreshold < 0 ||
    values.anomalyGradeThreshold > 1
  ) {
    return 'Anomaly grade threshold must be between 0 and 1.';
  }
  if (
    !Number.isFinite(values.anomalyConfidenceThreshold) ||
    values.anomalyConfidenceThreshold < 0 ||
    values.anomalyConfidenceThreshold > 1
  ) {
    return 'Confidence threshold must be between 0 and 1.';
  }
  return undefined;
};

export const buildAlertingMonitorPayload = ({
  detectorId,
  exploreMetrics,
  monitorName,
  scheduleIntervalMinutes,
  triggerName,
  severity,
  anomalyGradeThreshold,
  anomalyConfidenceThreshold,
  adResultIndex = DEFAULT_AD_RESULT_INDEX,
}: MetricsAlertFormValues & {
  detectorId: string;
  exploreMetrics?: MetricsAlertMonitorMetadata;
  adResultIndex?: string;
}) => {
  const intervalMinutes = Math.max(1, Math.round(scheduleIntervalMinutes));

  return {
    name: monitorName.trim(),
    type: 'monitor',
    monitor_type: 'query_level_monitor',
    enabled: true,
    schedule: {
      period: {
        interval: intervalMinutes,
        unit: 'MINUTES',
      },
    },
    inputs: [
      {
        search: {
          indices: [adResultIndex],
          query: {
            size: 1,
            sort: [{ anomaly_grade: 'desc' }, { confidence: 'desc' }],
            query: {
              bool: {
                filter: [
                  {
                    range: {
                      execution_end_time: {
                        from: `{{period_end}}||-${intervalMinutes}m`,
                        to: '{{period_end}}',
                        include_lower: true,
                        include_upper: true,
                      },
                    },
                  },
                  {
                    term: {
                      detector_id: {
                        value: detectorId,
                      },
                    },
                  },
                ],
              },
            },
            aggregations: {
              max_anomaly_grade: {
                max: {
                  field: 'anomaly_grade',
                },
              },
            },
          },
        },
      },
    ],
    triggers: [
      {
        name: triggerName.trim(),
        severity,
        condition: {
          script: {
            lang: 'painless',
            source:
              'return ctx.results != null && ctx.results.length > 0 && ctx.results[0].aggregations != null && ctx.results[0].aggregations.max_anomaly_grade != null && ctx.results[0].hits.total.value > 0 && ctx.results[0].hits.hits[0]._source != null && ctx.results[0].hits.hits[0]._source.confidence != null && ctx.results[0].aggregations.max_anomaly_grade.value != null && ctx.results[0].aggregations.max_anomaly_grade.value >=' +
              ` ${anomalyGradeThreshold}` +
              ` && ctx.results[0].hits.hits[0]._source.confidence >= ${anomalyConfidenceThreshold}`,
          },
        },
        actions: [],
        min_time_between_executions: null,
        rolling_window_size: null,
      },
    ],
    ui_metadata: {
      schedule: {
        period: {
          interval: intervalMinutes,
          unit: 'MINUTES',
        },
      },
      monitor_type: 'query_level_monitor',
      search: {
        searchType: 'ad',
        timeField: '',
        aggregations: [],
        groupBy: [],
        bucketValue: 1,
        bucketUnitOfTime: 'h',
        filters: [],
      },
      ...(exploreMetrics
        ? {
            explore_metrics: {
              created_by: 'explore_metrics',
              detector_id: exploreMetrics.detectorId,
              detector_name: exploreMetrics.detectorName,
              promql_query: exploreMetrics.promqlQuery,
              data_connection_id: exploreMetrics.dataConnectionId,
              data_source_id: exploreMetrics.dataSourceId,
              detector_mode: exploreMetrics.detectorMode,
              selected_series_id: exploreMetrics.selectedSeriesId,
              selected_entity_field: exploreMetrics.selectedEntityField,
              selected_series_labels: exploreMetrics.selectedSeriesLabels,
            },
          }
        : {}),
      triggers: {
        [triggerName.trim()]: {
          value: 10000,
          enum: 'ABOVE',
          adTriggerMetadata: {
            triggerType: 'anomaly_detector_trigger',
            anomalyGrade: {
              value: anomalyGradeThreshold,
              enum: 'ABOVE',
            },
            anomalyConfidence: {
              value: anomalyConfidenceThreshold,
              enum: 'ABOVE',
            },
          },
        },
      },
    },
  };
};
