/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart } from '../../../../../data/public';
import { PromQLToolName } from './promql_tools';

/** Default limit for metrics */
const DEFAULT_METRICS_LIMIT = 20;

/** Default limit for labels per metric */
const DEFAULT_LABELS_LIMIT = 20;

/** Default limit for sample values per label */
const DEFAULT_VALUES_LIMIT = 5;

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

      metricNames = (metricNames || []).slice(0, metricsLimit);

      if (metricNames.length === 0) {
        return { sharedLabels: [], metrics: [], labelValues: {} };
      }

      const [metadata, ...labelsResults] = await Promise.all([
        this.prometheusClient.getMetricMetadata(this.dataSourceName),
        ...metricNames.map((metric) =>
          this.prometheusClient.getLabels(this.dataSourceName, metric).catch(() => [])
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

      const labelValues: Record<string, string[]> = {};
      await Promise.all(
        Array.from(allLabelNames).map(async (label) => {
          const values = await this.prometheusClient
            .getLabelValues(this.dataSourceName, label)
            .catch(() => []);
          labelValues[label] = values.slice(0, valuesLimit);
        })
      );

      return { sharedLabels, metrics, labelValues };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to search Prometheus metadata:', error);
      return { sharedLabels: [], metrics: [], labelValues: {} };
    }
  }
}
