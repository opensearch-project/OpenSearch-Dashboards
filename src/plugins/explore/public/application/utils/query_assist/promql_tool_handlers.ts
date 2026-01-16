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

interface SearchPrometheusMetadataArgs {
  query?: string; // Optional filter/search pattern
  limit?: number; // Maximum number of results
}

interface MetricInfo {
  name: string;
  type?: string;
  help?: string;
  labels: string[];
}

interface SearchPrometheusMetadataResult {
  metrics: MetricInfo[];
  commonLabels: string[];
  labelValues: Record<string, string[]>;
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

/**
 * Handlers for PromQL frontend tools
 * Consolidated handler that returns metrics, labels, and sample values in one call
 */
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

  /**
   * Update the data source name (e.g., when user switches data sources)
   */
  public setDataSourceName(dataSourceName: string): void {
    this.dataSourceName = dataSourceName;
  }

  /**
   * Execute a tool by name
   */
  public async executeTool(
    toolName: PromQLToolName,
    args: SearchPrometheusMetadataArgs
  ): Promise<SearchPrometheusMetadataResult> {
    switch (toolName) {
      case 'search_prometheus_metadata':
        return this.searchPrometheusMetadata(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Search Prometheus metadata - consolidated method that returns metrics with their labels
   * and sample values for common labels in a single call
   */
  public async searchPrometheusMetadata(
    args: SearchPrometheusMetadataArgs
  ): Promise<SearchPrometheusMetadataResult> {
    try {
      // Step 1: Fetch and filter metric names
      let metricNames = await this.prometheusClient.getMetrics(this.dataSourceName);

      if (args.query) {
        try {
          // Try to use query as regex pattern
          const regex = new RegExp(args.query, 'i');
          metricNames = (metricNames || []).filter((name) => regex.test(name));
        } catch {
          // If invalid regex, fall back to substring matching
          const queryLower = args.query.toLowerCase();
          metricNames = (metricNames || []).filter((name) => name.toLowerCase().includes(queryLower));
        }
      }

      const limit = args.limit || DEFAULT_METRICS_LIMIT;
      metricNames = (metricNames || []).slice(0, limit);

      if (metricNames.length === 0) {
        return { metrics: [], commonLabels: [], labelValues: {} };
      }

      // Step 2: Fetch metadata and labels in parallel
      const [metadata, ...labelsResults] = await Promise.all([
        this.prometheusClient.getMetricMetadata(this.dataSourceName),
        ...metricNames.map((metric) =>
          this.prometheusClient.getLabels(this.dataSourceName, metric).catch(() => [])
        ),
      ]);

      // Step 3: Build metrics array with labels
      const metrics: MetricInfo[] = metricNames.map((name, index) => {
        const metaInfo = (metadata as MetricMetadata)?.[name];
        return {
          name,
          type: metaInfo?.[0]?.type,
          help: metaInfo?.[0]?.help,
          labels: labelsResults[index] || [],
        };
      });

      // Step 4: Compute common labels (intersection of all metric labels)
      const commonLabels = this.computeCommonLabels(labelsResults);

      // Step 5: Fetch sample values for all common labels
      const labelValuesResults = await Promise.all(
        commonLabels.map((label) =>
          this.prometheusClient
            .getLabelValues(this.dataSourceName, label)
            .then((values) => ({ label, values: (values || []).slice(0, MAX_LABEL_VALUES) }))
            .catch(() => ({ label, values: [] as string[] }))
        )
      );

      const labelValues: Record<string, string[]> = {};
      for (const { label, values } of labelValuesResults) {
        if (values.length > 0) {
          labelValues[label] = values;
        }
      }

      return { metrics, commonLabels, labelValues };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to search Prometheus metadata:', error);
      return { metrics: [], commonLabels: [], labelValues: {} };
    }
  }

  /**
   * Compute the intersection of labels across all metrics
   */
  private computeCommonLabels(labelsArrays: string[][]): string[] {
    if (labelsArrays.length === 0) {
      return [];
    }

    const validArrays = labelsArrays.filter((arr) => arr && arr.length > 0);
    if (validArrays.length === 0) {
      return [];
    }

    // Start with the first array and intersect with all others
    let common = new Set(validArrays[0]);
    for (let i = 1; i < validArrays.length; i++) {
      const currentSet = new Set(validArrays[i]);
      common = new Set([...common].filter((label) => currentSet.has(label)));
    }

    return Array.from(common).sort();
  }
}
