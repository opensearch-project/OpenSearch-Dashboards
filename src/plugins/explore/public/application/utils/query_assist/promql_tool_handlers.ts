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

/** Maximum concurrent requests for getLabels */
const MAX_CONCURRENT_LABEL_REQUESTS = 5;

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
  sharedLabels: string[];
  metrics: MetricInfo[];
  labelValues: Record<string, string[]>;
}

interface PrometheusResourceClient {
  getMetrics: (dataConnectionId: string, timeRange?: TimeRange) => Promise<string[]>;
  getMetricMetadata: (
    dataConnectionId: string,
    metric?: string,
    timeRange?: TimeRange
  ) => Promise<Record<string, Array<{ type: string; help: string }>>>;
  getLabels: (
    dataConnectionId: string,
    metric?: string,
    timeRange?: TimeRange
  ) => Promise<string[]>;
  getLabelValues: (
    dataConnectionId: string,
    label: string,
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
  private data: DataPublicPluginStart;

  constructor(data: DataPublicPluginStart, dataSourceName: string) {
    const client = data.resourceClientFactory.get<PrometheusResourceClient>('prometheus');
    if (!client) {
      throw new Error('Prometheus resource client not found');
    }
    this.prometheusClient = client;
    this.dataSourceName = dataSourceName;
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

      let metricNames = await this.prometheusClient.getMetrics(this.dataSourceName, timeRange);

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
        return { sharedLabels: [], metrics: [], labelValues: {} };
      }

      const [metadata, labelsResults] = await Promise.all([
        this.prometheusClient.getMetricMetadata(this.dataSourceName, undefined, timeRange),
        executeWithConcurrencyLimit(
          metricNames.map((metric) => () =>
            this.prometheusClient.getLabels(this.dataSourceName, metric, timeRange).catch(() => [])
          ),
          MAX_CONCURRENT_LABEL_REQUESTS
        ),
      ]);

      const allLabelSets: string[][] = metricNames.map((_, index) =>
        (labelsResults[index] || []).slice(0, labelsLimit)
      );

      const sharedLabels =
        allLabelSets.length > 0
          ? allLabelSets.reduce((common, labels) =>
              common.filter((label) => labels.includes(label))
            )
          : [];

      const allLabelNames = new Set<string>();
      const metrics: MetricInfo[] = metricNames.map((name, index) => {
        const metaInfo = (metadata as MetricMetadata)?.[name];
        const labels = allLabelSets[index].filter((l) => !sharedLabels.includes(l));
        allLabelSets[index].forEach((label) => allLabelNames.add(label));
        return {
          name,
          type: metaInfo?.[0]?.type,
          help: metaInfo?.[0]?.help,
          labels,
        };
      });

      const labelNamesList = Array.from(allLabelNames);
      const labelValuesResults = await executeWithConcurrencyLimit(
        labelNamesList.map((label) => () =>
          this.prometheusClient
            .getLabelValues(this.dataSourceName, label, timeRange)
            .catch(() => [])
        ),
        MAX_CONCURRENT_LABEL_REQUESTS
      );
      const labelValues: Record<string, string[]> = {};
      labelNamesList.forEach((label, index) => {
        labelValues[label] = labelValuesResults[index].slice(0, valuesLimit);
      });

      return { sharedLabels, metrics, labelValues };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to search Prometheus metadata:', error);
      return { sharedLabels: [], metrics: [], labelValues: {} };
    }
  }
}
