/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChartConfig,
  VisData,
} from '../../../../../../components/visualizations/visualization_builder.types';
import { VisColumn } from '../../../../../../components/visualizations/types';
import {
  PROMETHEUS_DETECTOR_MODES,
  PrometheusDetectorMode,
} from '../../../../utils/metrics_feature_constants';

export interface PrometheusSeriesOption {
  id: string;
  label: string;
  labels: Record<string, string>;
}

export interface PrometheusSeriesInference {
  seriesCount: number;
  seriesOptions: PrometheusSeriesOption[];
  varyingLabels: string[];
  suggestedEntityFields: string[];
  defaultDetectorMode: PrometheusDetectorMode;
  defaultSeriesId?: string;
  defaultEntityField?: string;
}

const SERIES_LABEL_REGEX = /([a-zA-Z_][a-zA-Z0-9_:]*)\s*=\s*"([^"]*)"/g;
const FALLBACK_SERIES_LABEL_REGEX = /([a-zA-Z_][a-zA-Z0-9_:]*)\s*=\s*([^,{}]+)/g;
const PRIORITIZED_ENTITY_FIELDS = [
  'pod',
  'service',
  'node',
  'instance',
  'container',
  'namespace',
  'job',
];
const DEPRIORITIZED_ENTITY_FIELDS = new Set(['quantile', 'le']);

const normalizeSeriesId = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value ?? '').trim();
};

const resolveKey = (
  preferredName: string | undefined,
  fallbackMatchers: RegExp[],
  allVisColumns: VisColumn[],
  candidateRows: Array<Record<string, any>>
): string | undefined => {
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

  return Object.keys(firstRow).find((key) => fallbackMatchers.some((matcher) => matcher.test(key)));
};

const parseSeriesLabels = (value: unknown): Record<string, string> => {
  if (!value) {
    return {};
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key, rawValue]) => key !== '__name__' && rawValue != null)
        .map(([key, rawValue]) => [key, String(rawValue)])
    );
  }

  const text = String(value).trim();
  if (!text) {
    return {};
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>)
          .filter(([key, rawValue]) => key !== '__name__' && rawValue != null)
          .map(([key, rawValue]) => [key, String(rawValue)])
      );
    }
  } catch (_error) {
    // Fall through to Prometheus label parsing.
  }

  const quotedMatches = Array.from(text.matchAll(SERIES_LABEL_REGEX));
  if (quotedMatches.length > 0) {
    return Object.fromEntries(quotedMatches.map((match) => [match[1], match[2]]));
  }

  const fallbackMatches = Array.from(text.matchAll(FALLBACK_SERIES_LABEL_REGEX));
  if (fallbackMatches.length > 0) {
    return Object.fromEntries(
      fallbackMatches.map((match) => [match[1], match[2].trim().replace(/^"|"$/g, '')])
    );
  }

  return {};
};

const buildSeriesLabel = (rawSeriesValue: unknown, labels: Record<string, string>): string => {
  const rawText = String(rawSeriesValue ?? '').trim();
  if (rawText) {
    return rawText;
  }

  const labelEntries = Object.entries(labels);
  if (labelEntries.length === 0) {
    return 'Current metric';
  }

  const labelText = labelEntries
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}="${value}"`)
    .join(', ');

  return `{${labelText}}`;
};

const rankEntityFields = (varyingLabels: string[]): string[] => {
  const prioritized = PRIORITIZED_ENTITY_FIELDS.filter((field) => varyingLabels.includes(field));
  const remaining = varyingLabels
    .filter(
      (field) =>
        !prioritized.includes(field) && !DEPRIORITIZED_ENTITY_FIELDS.has(field.toLowerCase())
    )
    .sort((left, right) => left.localeCompare(right));
  const deprioritized = varyingLabels
    .filter((field) => DEPRIORITIZED_ENTITY_FIELDS.has(field.toLowerCase()))
    .sort((left, right) => left.localeCompare(right));

  return [...prioritized, ...remaining, ...deprioritized];
};

export const inferPrometheusSeries = (
  visData?: VisData,
  chartConfig?: ChartConfig
): PrometheusSeriesInference => {
  const candidateRows = Array.isArray(visData?.transformedData)
    ? (visData?.transformedData as Array<Record<string, any>>)
    : [];

  if (candidateRows.length === 0) {
    return {
      seriesCount: 0,
      seriesOptions: [],
      varyingLabels: [],
      suggestedEntityFields: [],
      defaultDetectorMode: PROMETHEUS_DETECTOR_MODES.singleStream,
    };
  }

  const allVisColumns = [
    ...(visData?.numericalColumns ?? []),
    ...(visData?.categoricalColumns ?? []),
    ...(visData?.dateColumns ?? []),
  ];
  const axesMapping = chartConfig?.axesMapping ?? {};
  const effectiveSeriesKey = resolveKey(
    axesMapping.color,
    [/^series$/i, /^metric$/i, /label/i],
    allVisColumns,
    candidateRows
  );

  if (!effectiveSeriesKey) {
    return {
      seriesCount: 1,
      seriesOptions: [
        {
          id: '__current_metric__',
          label: 'Current metric',
          labels: {},
        },
      ],
      varyingLabels: [],
      suggestedEntityFields: [],
      defaultDetectorMode: PROMETHEUS_DETECTOR_MODES.singleStream,
      defaultSeriesId: '__current_metric__',
    };
  }

  const seriesOptions = Array.from(
    candidateRows
      .reduce((accumulator, row) => {
        const rawSeriesValue = row?.[effectiveSeriesKey];
        if (rawSeriesValue == null || String(rawSeriesValue).trim() === '') {
          return accumulator;
        }

        const id = normalizeSeriesId(rawSeriesValue);
        if (!id || accumulator.has(id)) {
          return accumulator;
        }

        const labels = parseSeriesLabels(rawSeriesValue);
        accumulator.set(id, {
          id,
          label: buildSeriesLabel(rawSeriesValue, labels),
          labels,
        });
        return accumulator;
      }, new Map<string, PrometheusSeriesOption>())
      .values()
  );

  if (seriesOptions.length <= 1) {
    const singleSeries = seriesOptions[0];
    return {
      seriesCount: 1,
      seriesOptions:
        seriesOptions.length === 1
          ? seriesOptions
          : [
              {
                id: '__current_metric__',
                label: 'Current metric',
                labels: {},
              },
            ],
      varyingLabels: [],
      suggestedEntityFields: [],
      defaultDetectorMode: PROMETHEUS_DETECTOR_MODES.singleStream,
      defaultSeriesId: singleSeries?.id || '__current_metric__',
    };
  }

  const labelValues = seriesOptions.reduce((accumulator, option) => {
    Object.entries(option.labels).forEach(([key, value]) => {
      const values = accumulator.get(key) ?? new Set<string>();
      values.add(value);
      accumulator.set(key, values);
    });
    return accumulator;
  }, new Map<string, Set<string>>());

  const varyingLabels = Array.from(labelValues.entries())
    .filter(([key, values]) => key !== '__name__' && values.size > 1)
    .map(([key]) => key)
    .sort((left, right) => left.localeCompare(right));
  const suggestedEntityFields = rankEntityFields(varyingLabels);

  return {
    seriesCount: seriesOptions.length,
    seriesOptions,
    varyingLabels,
    suggestedEntityFields,
    defaultDetectorMode: PROMETHEUS_DETECTOR_MODES.highCardinality,
    defaultSeriesId: seriesOptions[0]?.id,
    defaultEntityField: suggestedEntityFields[0],
  };
};
