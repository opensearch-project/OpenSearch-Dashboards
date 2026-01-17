/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../../../data/public';
import { PromQLToolName } from './promql_tools';

/** Maximum sample values to return per label */
const MAX_LABEL_VALUES = 5;

/** Default limit for metrics */
const DEFAULT_METRICS_LIMIT = 20;

/** Labels per metric in metadata search */
const LABELS_PER_METRIC = 5;

interface SearchPrometheusMetadataArgs {
  query?: string;
  limit?: number;
}

interface SearchPrometheusLabelsArgs {
  metricNames: string[];
}

interface MetricInfo {
  name: string;
  type?: string;
  help?: string;
  labels: string[];
}

interface SearchPrometheusMetadataResult {
  metrics: MetricInfo[];
}

interface SearchPrometheusLabelsResult {
  labelsByMetric: Record<string, Record<string, string[]>>;
}

interface PrometheusResourceClient {
  getMetrics: (dataSourceId: string) => Promise<string[]>;
  getMetricMetadata: (
    dataSourceId: string
  ) => Promise<Record<string, Array<{ type: string; help: string }>>>;
  getLabels: (dataSourceId: string, metric?: string) => Promise<string[]>;
  getLabelValues: (dataSourceId: string, label: string, metric?: string) => Promise<string[]>;
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

  constructor(data: DataPublicPluginStart, dataSourceName: string) {
    const client = data.resourceClientFactory.get<PrometheusResourceClient>('prometheus');
    if (!client) {
      throw new Error('Prometheus resource client not found');
    }
    this.prometheusClient = client;
    this.dataSourceName = dataSourceName;
  }

  public async executeTool(
    toolName: PromQLToolName,
    args: SearchPrometheusMetadataArgs | SearchPrometheusLabelsArgs
  ): Promise<SearchPrometheusMetadataResult | SearchPrometheusLabelsResult> {
    switch (toolName) {
      case PromQLToolName.SEARCH_PROMETHEUS_METADATA:
        return this.searchPrometheusMetadata(args as SearchPrometheusMetadataArgs);
      case PromQLToolName.SEARCH_PROMETHEUS_LABELS:
        return this.searchPrometheusLabels(args as SearchPrometheusLabelsArgs);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  public async searchPrometheusMetadata(
    args: SearchPrometheusMetadataArgs
  ): Promise<SearchPrometheusMetadataResult> {
    try {
      let metricNames = await this.prometheusClient.getMetrics(this.dataSourceName);

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

      metricNames = (metricNames || []).slice(0, args.limit || DEFAULT_METRICS_LIMIT);

      if (metricNames.length === 0) {
        return { metrics: [] };
      }

      const [metadata, ...labelsResults] = await Promise.all([
        this.prometheusClient.getMetricMetadata(this.dataSourceName),
        ...metricNames.map((metric) =>
          this.prometheusClient.getLabels(this.dataSourceName, metric).catch(() => [])
        ),
      ]);

      const metrics: MetricInfo[] = metricNames.map((name, index) => {
        const metaInfo = (metadata as MetricMetadata)?.[name];
        const labels = (labelsResults[index] || []).slice(0, LABELS_PER_METRIC);
        return {
          name,
          type: metaInfo?.[0]?.type,
          help: metaInfo?.[0]?.help,
          labels,
        };
      });

      return { metrics };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to search Prometheus metadata:', error);
      return { metrics: [] };
    }
  }

  public async searchPrometheusLabels(
    args: SearchPrometheusLabelsArgs
  ): Promise<SearchPrometheusLabelsResult> {
    try {
      const labelsByMetric: Record<string, Record<string, string[]>> = {};

      await Promise.all(
        args.metricNames.map(async (metric) => {
          const labels = await this.prometheusClient
            .getLabels(this.dataSourceName, metric)
            .catch(() => []);

          const labelValues: Record<string, string[]> = {};
          await Promise.all(
            labels.map(async (label) => {
              const values = await this.prometheusClient
                .getLabelValues(this.dataSourceName, label, metric)
                .catch(() => []);
              labelValues[label] = values.slice(0, MAX_LABEL_VALUES);
            })
          );

          labelsByMetric[metric] = labelValues;
        })
      );

      return { labelsByMetric };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to search Prometheus labels:', error);
      return { labelsByMetric: {} };
    }
  }
}
