/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { prometheusManager } from '../../../connections/managers/prometheus_manager';
import { RESOURCE_TYPES } from '../../../../common/constants';
import type { LanguageHandler, LanguageHandlerContext } from '../language_handlers';

interface PrometheusMetadataResult {
  metrics: string[];
  labels: string[];
}

const getPrometheusMetadata = async (
  handlerContext: LanguageHandlerContext
): Promise<PrometheusMetadataResult> => {
  const { context, request, index: dataSourceName, logger } = handlerContext;

  try {
    const [labelsResponse, metricsResponse] = await Promise.all([
      prometheusManager.getResources<string[]>(context, request, {
        dataSourceName,
        resourceType: RESOURCE_TYPES.PROMETHEUS.LABELS,
        resourceName: undefined,
        query: {},
      }),
      prometheusManager.getResources<string[]>(context, request, {
        dataSourceName,
        resourceType: RESOURCE_TYPES.PROMETHEUS.METRICS,
        resourceName: undefined,
        query: {},
      }),
    ]);

    const labels = labelsResponse.status === 'success' ? labelsResponse.data : [];
    const metrics = metricsResponse.status === 'success' ? metricsResponse.data : [];

    return { metrics, labels };
  } catch (error) {
    logger.error(`Failed to fetch Prometheus metadata: ${error}`);
    return { metrics: [], labels: [] };
  }
};

const formatPrometheusMetadataForPrompt = (metadata: PrometheusMetadataResult): string => {
  const { metrics, labels } = metadata;
  const labelsSection = `Available labels: ${labels.join(', ')}`;
  const metricsSection = `Available metrics:\n${metrics.map((metric) => `- ${metric}`).join('\n')}`;
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
