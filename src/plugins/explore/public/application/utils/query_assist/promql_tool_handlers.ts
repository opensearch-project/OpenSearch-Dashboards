/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart, TimeRange } from '../../../../../data/public';
import { PromQLToolName } from './promql_tools';

/** Default limit for metrics */
const DEFAULT_METRICS_LIMIT = 10;

/** Default limit for labels per metric */
const DEFAULT_LABELS_LIMIT = 10;

/** Default limit for sample values per label */
const DEFAULT_VALUES_LIMIT = 3;

/** Maximum concurrent requests */
const MAX_CONCURRENT_REQUESTS = 5;

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

      // Use getLabels per metric instead of the expensive getSeries endpoint.
      // getLabels hits /api/v1/labels?match[]={__name__="metric"} which only
      // returns label names — orders of magnitude cheaper than /api/v1/series.
      const labelTasks = metricNames.map((metric) => () =>
        this.prometheusClient
          .getLabels(this.dataSourceName, this.dataSourceMeta, metric, timeRange)
          .then((labels) => labels.filter((l) => l !== '__name__'))
          .catch(() => [] as string[])
      );

      const [metadata, labelsPerMetric] = await Promise.all([
        this.prometheusClient
          .getMetricMetadata(this.dataSourceName, this.dataSourceMeta, undefined, timeRange)
          .catch(() => ({} as Record<string, Array<{ type: string; help: string }>>)),
        executeWithConcurrencyLimit(labelTasks, MAX_CONCURRENT_REQUESTS),
      ]);

      // Compute labels common to all metrics
      const allLabelSets = labelsPerMetric.map((labels) => labels.slice(0, labelsLimit));
      const labelsCommonToAllMetrics =
        allLabelSets.length > 0
          ? allLabelSets.reduce((common, labels) =>
              common.filter((label) => labels.includes(label))
            )
          : [];

      // Collect all unique label names for value fetching
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

      // Fetch sample values for each label using the lightweight getLabelValues API
      const labelNames = Array.from(allLabelNames);
      const valueTasks = labelNames.map((label) => () =>
        this.prometheusClient
          .getLabelValues(this.dataSourceName, this.dataSourceMeta, label, timeRange)
          .then((values) => values.slice(0, valuesLimit))
          .catch(() => [] as string[])
      );
      const valuesResults = await executeWithConcurrencyLimit(valueTasks, MAX_CONCURRENT_REQUESTS);

      const labelValues: Record<string, string[]> = {};
      labelNames.forEach((label, i) => {
        if (valuesResults[i].length > 0) {
          labelValues[label] = valuesResults[i];
        }
      });

      return { labelsCommonToAllMetrics, metrics, labelValues };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to search Prometheus metadata:', error);
      return { labelsCommonToAllMetrics: [], metrics: [], labelValues: {} };
    }
  }
}
