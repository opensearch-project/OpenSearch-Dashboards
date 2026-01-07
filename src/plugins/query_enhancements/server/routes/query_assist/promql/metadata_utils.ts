/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  prometheusManager,
  MetricMetadata,
} from '../../../connections/managers/prometheus_manager';
import { LanguageHandler, LanguageHandlerContext } from '../language_handlers';

export interface PrometheusMetadataResult {
  metrics: string[];
  labels: string[];
  metricMetadata: MetricMetadata;
}

const getPrometheusMetadata = async (
  handlerContext: LanguageHandlerContext
): Promise<PrometheusMetadataResult> => {
  const { context, request, dataSourceName, logger } = handlerContext;

  try {
    const [labelsResponse, metadataResponse] = await Promise.all([
      prometheusManager.getResources<string[]>(context, request, {
        dataSourceName,
        resourceType: 'labels',
        resourceName: undefined,
        query: {},
      }),
      prometheusManager.getResources<MetricMetadata>(context, request, {
        dataSourceName,
        resourceType: 'metric_metadata',
        resourceName: undefined,
        query: {},
      }),
    ]);

    const labels = labelsResponse.status === 'success' ? labelsResponse.data : [];
    const metricMetadata = metadataResponse.status === 'success' ? metadataResponse.data : {};
    const metrics = Object.keys(metricMetadata);

    return { metrics, labels, metricMetadata };
  } catch (error) {
    logger.error(`Failed to fetch Prometheus metadata: ${error}`);
    return { metrics: [], labels: [], metricMetadata: {} };
  }
};

const formatPrometheusMetadataForPrompt = (metadata: PrometheusMetadataResult): string => {
  const { metrics, labels, metricMetadata } = metadata;
  const labelsSection = `Available labels: ${labels.join(', ')}`;
  const metricsWithInfo = metrics.map((metric) => {
    const info = metricMetadata[metric]?.[0];
    if (info) {
      return `- ${metric} (${info.type}): ${info.help}`;
    }
    return `- ${metric}`;
  });
  const metricsSection = `Available metrics:\n${metricsWithInfo.join('\n')}`;
  return `${labelsSection}\n\n${metricsSection}`;
};

export const promqlHandler: LanguageHandler = {
  getAdditionalAgentParameters: async (handlerContext): Promise<Record<string, string>> => {
    try {
      const metadata = await getPrometheusMetadata(handlerContext);
      const metadataString = formatPrometheusMetadataForPrompt(metadata);
      return { metadata: metadataString };
    } catch (error) {
      handlerContext.logger.warn(
        `Failed to fetch Prometheus metadata, proceeding without it: ${error}`
      );
      return {};
    }
  },
};
