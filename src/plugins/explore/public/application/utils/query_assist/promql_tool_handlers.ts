/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../../../data/public';
import { PromQLToolName } from './promql_tools';

interface SearchMetricsArgs {
  query?: string; // Optional filter/search pattern
  limit?: number; // Maximum number of results
}

interface SearchLabelsArgs {
  metric?: string; // Optional metric name to get labels for
}

interface SearchLabelValuesArgs {
  label: string; // Required: the label name
  metric?: string; // Optional: filter by metric
}

interface SearchMetricsResult {
  metrics: Array<{
    name: string;
    type?: string;
    help?: string;
  }>;
}

interface SearchLabelsResult {
  labels: string[];
}

interface SearchLabelValuesResult {
  values: string[];
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
 * These handlers execute the actual Prometheus metadata searches
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
    args: SearchMetricsArgs | SearchLabelsArgs | SearchLabelValuesArgs
  ): Promise<SearchMetricsResult | SearchLabelsResult | SearchLabelValuesResult> {
    switch (toolName) {
      case 'search_metrics':
        return this.searchMetrics(args as SearchMetricsArgs);
      case 'search_labels':
        return this.searchLabels(args as SearchLabelsArgs);
      case 'search_label_values':
        return this.searchLabelValues(args as SearchLabelValuesArgs);
    }
  }

  /**
   * Search for available metrics
   */
  public async searchMetrics(args: SearchMetricsArgs): Promise<SearchMetricsResult> {
    try {
      let metricNames = await this.prometheusClient.getMetrics(this.dataSourceName);

      if (args.query) {
        const queryLower = args.query.toLowerCase();
        metricNames = (metricNames || []).filter((name) => name.toLowerCase().includes(queryLower));
      }

      const limit = args.limit || 100;
      metricNames = (metricNames || []).slice(0, limit);

      const metadata = await this.prometheusClient.getMetricMetadata(this.dataSourceName);
      const metrics = metricNames.map((name) => {
        const metaInfo = (metadata as MetricMetadata)?.[name];
        return {
          name,
          type: metaInfo?.[0]?.type,
          help: metaInfo?.[0]?.help,
        };
      });

      return { metrics };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to search metrics:', error);
      return { metrics: [] };
    }
  }

  /**
   * Search for available labels
   */
  public async searchLabels(args: SearchLabelsArgs): Promise<SearchLabelsResult> {
    try {
      const labels = await this.prometheusClient.getLabels(this.dataSourceName, args.metric);
      return { labels: labels || [] };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to search labels:', error);
      return { labels: [] };
    }
  }

  /**
   * Search for label values
   */
  public async searchLabelValues(args: SearchLabelValuesArgs): Promise<SearchLabelValuesResult> {
    if (!args.label) {
      throw new Error('Label name is required');
    }

    try {
      const values = await this.prometheusClient.getLabelValues(this.dataSourceName, args.label);
      return { values: values || [] };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to search label values:', error);
      return { values: [] };
    }
  }
}
