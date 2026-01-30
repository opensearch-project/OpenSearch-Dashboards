/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart, TimeRange } from '../../../../../data/public';
import { PromQLToolName } from './promql_tools';

/** Default limit for metrics */
const DEFAULT_METRICS_LIMIT = 20;

/** Default limit for labels per metric */
const DEFAULT_LABELS_LIMIT = 20;

/** Default limit for sample values per label */
const DEFAULT_VALUES_LIMIT = 5;

/** Maximum concurrent requests for series API batches */
const MAX_CONCURRENT_REQUESTS = 5;

/** Maximum metrics per series API call to avoid URL length limits */
const MAX_METRICS_PER_SERIES_BATCH = 10;

async function executeWithConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit);
    const batchResults = await Promise.all(batch.map((task) => task()));
    results.push(...batchResults);
  }
  return results;
}

/**
 * Escapes special regex characters in metric names for use in Prometheus match
 * selector. This is needed because currently backend only supports one match[]
 * value, and we are sending multiple names as regex.
 * TODO use multiple match[] parameters when backend supports it.
 */
function escapeRegexForPrometheus(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface SearchPrometheusMetadataArgs {
  query?: string;
  metricsLimit?: number;
  labelsLimit?: number;
  valuesLimit?: number;
}

interface MetricInfo {
  name: string;
  type?: string;
  help?: string;
  labels: string[];
}

interface SearchPrometheusMetadataResult {
  labelsCommonToAllMetrics: string[];
  metrics: MetricInfo[];
  labelValues: Record<string, string[]>;
}

interface PrometheusResourceClient {
  getMetrics: (
    dataConnectionId: string,
    meta?: Record<string, unknown>,
    timeRange?: TimeRange
  ) => Promise<string[]>;
  getMetricMetadata: (
    dataConnectionId: string,
    meta?: Record<string, unknown>,
    metric?: string,
    timeRange?: TimeRange
  ) => Promise<Record<string, Array<{ type: string; help: string }>>>;
  getLabels: (
    dataConnectionId: string,
    meta?: Record<string, unknown>,
    metric?: string,
    timeRange?: TimeRange
  ) => Promise<string[]>;
  getLabelValues: (
    dataConnectionId: string,
    meta?: Record<string, unknown>,
    label?: string,
    timeRange?: TimeRange
  ) => Promise<string[]>;
  getSeries: (
    dataConnectionId: string,
    match: string,
    meta?: Record<string, unknown>,
    timeRange?: TimeRange
  ) => Promise<Array<Record<string, string>>>;
}

interface MetricMetadata {
  [metric: string]: Array<{
    type: string;
    unit: string;
    help: string;
  }>;
}

export class PromQLToolHandlers {
  private prometheusClient: PrometheusResourceClient;
  private dataSourceName: string;
  private dataSourceMeta?: Record<string, unknown>;
  private data: DataPublicPluginStart;

  constructor(
    data: DataPublicPluginStart,
    dataSourceName: string,
    dataSourceMeta?: Record<string, unknown>
  ) {
    const client = data.resourceClientFactory.get<PrometheusResourceClient>('prometheus');
    if (!client) {
      throw new Error('Prometheus resource client not found');
    }
    this.prometheusClient = client;
    this.dataSourceName = dataSourceName;
    this.dataSourceMeta = dataSourceMeta;
    this.data = data;
  }

  public async executeTool(
    toolName: PromQLToolName,
    args: SearchPrometheusMetadataArgs
  ): Promise<SearchPrometheusMetadataResult> {
    switch (toolName) {
      case PromQLToolName.SEARCH_PROMETHEUS_METADATA:
        return this.searchPrometheusMetadata(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  public async searchPrometheusMetadata(
    args: SearchPrometheusMetadataArgs
  ): Promise<SearchPrometheusMetadataResult> {
    try {
      const metricsLimit = args.metricsLimit ?? DEFAULT_METRICS_LIMIT;
      const labelsLimit = args.labelsLimit ?? DEFAULT_LABELS_LIMIT;
      const valuesLimit = args.valuesLimit ?? DEFAULT_VALUES_LIMIT;
      const timeRange = this.data.query.timefilter.timefilter.getTime();

      let metricNames = await this.prometheusClient.getMetrics(
        this.dataSourceName,
        this.dataSourceMeta,
        timeRange
      );

      if (args.query) {
        try {
          const regex = new RegExp(args.query, 'i');
          metricNames = (metricNames || []).filter((name) => regex.test(name));
        } catch {
          const queryLower = args.query.toLowerCase();
          metricNames = (metricNames || []).filter((name) =>
            name.toLowerCase().includes(queryLower)
          );
        }
      }

      metricNames = (metricNames || []).slice(0, metricsLimit);

      if (metricNames.length === 0) {
        return { labelsCommonToAllMetrics: [], metrics: [], labelValues: {} };
      }

      // Batch metrics to avoid URL length limits
      const metricBatches: string[][] = [];
      for (let i = 0; i < metricNames.length; i += MAX_METRICS_PER_SERIES_BATCH) {
        metricBatches.push(metricNames.slice(i, i + MAX_METRICS_PER_SERIES_BATCH));
      }

      // Build match selectors for each batch: {__name__=~"metric1|metric2|..."}
      const seriesTasks = metricBatches.map((batch) => () => {
        const escapedMetrics = batch.map(escapeRegexForPrometheus);
        const matchSelector = `{__name__=~"${escapedMetrics.join('|')}"}`;
        return this.prometheusClient
          .getSeries(this.dataSourceName, matchSelector, this.dataSourceMeta, timeRange)
          .catch(() => []);
      });

      const [metadata, seriesResults] = await Promise.all([
        this.prometheusClient.getMetricMetadata(
          this.dataSourceName,
          this.dataSourceMeta,
          undefined,
          timeRange
        ),
        executeWithConcurrencyLimit(seriesTasks, MAX_CONCURRENT_REQUESTS),
      ]);

      const seriesData = seriesResults.flat();

      const labelsPerMetric: Map<string, Set<string>> = new Map();
      const valuesPerLabel: Map<string, Set<string>> = new Map();
      metricNames.forEach((name) => labelsPerMetric.set(name, new Set()));

      for (const series of seriesData) {
        const metricName = series.__name__;
        if (metricName && labelsPerMetric.has(metricName)) {
          const labelSet = labelsPerMetric.get(metricName)!;
          for (const [labelName, labelValue] of Object.entries(series)) {
            if (labelName !== '__name__') {
              labelSet.add(labelName);
              if (!valuesPerLabel.has(labelName)) {
                valuesPerLabel.set(labelName, new Set());
              }
              valuesPerLabel.get(labelName)!.add(labelValue);
            }
          }
        }
      }

      const allLabelSets: string[][] = metricNames.map((name) => {
        const labelSet = labelsPerMetric.get(name) || new Set<string>();
        return Array.from(labelSet).slice(0, labelsLimit);
      });

      const labelsCommonToAllMetrics =
        allLabelSets.length > 0
          ? allLabelSets.reduce((common, labels) =>
              common.filter((label) => labels.includes(label))
            )
          : [];

      const allLabelNames = new Set<string>();
      const metrics: MetricInfo[] = metricNames.map((name, index) => {
        const metaInfo = (metadata as MetricMetadata)?.[name];
        const labels = allLabelSets[index].filter((l) => !labelsCommonToAllMetrics.includes(l));
        allLabelSets[index].forEach((label) => allLabelNames.add(label));
        return {
          name,
          type: metaInfo?.[0]?.type,
          help: metaInfo?.[0]?.help,
          labels,
        };
      });

      const labelValues: Record<string, string[]> = {};
      for (const labelName of allLabelNames) {
        const values = valuesPerLabel.get(labelName) || new Set<string>();
        labelValues[labelName] = Array.from(values).slice(0, valuesLimit);
      }

      return { labelsCommonToAllMetrics, metrics, labelValues };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to search Prometheus metadata:', error);
      return { labelsCommonToAllMetrics: [], metrics: [], labelValues: {} };
    }
  }
}
