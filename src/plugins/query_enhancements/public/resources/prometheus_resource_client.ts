/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import dateMath from '@elastic/datemath';
import { HttpSetup } from 'opensearch-dashboards/public';
import { BaseResourceClient, TimeRange } from '../../../data/public';
import { RESOURCE_TYPES } from '../../common/constants';

/**
 * Interface for Prometheus metric metadata
 */
interface PrometheusMetricMetadata {
  [metric: string]: Array<{
    type: string;
    unit: string;
    help: string;
  }>;
}

export class PrometheusResourceClient extends BaseResourceClient {
  constructor(http: HttpSetup) {
    super(http, 'prometheus');
  }

  /**
   * Converts a TimeRange to content object with Unix timestamps for Prometheus API
   */
  private toContent(timeRange?: TimeRange): Record<string, unknown> | undefined {
    if (!timeRange) return undefined;

    const parsedFrom = dateMath.parse(timeRange.from);
    const parsedTo = dateMath.parse(timeRange.to, { roundUp: true });

    if (!parsedFrom || !parsedTo) {
      return undefined;
    }

    return {
      start: parsedFrom.unix(),
      end: parsedTo.unix(),
    };
  }

  getLabels(dataConnectionId: string, metric?: string, timeRange?: TimeRange) {
    return this.get<string[]>(
      dataConnectionId,
      RESOURCE_TYPES.PROMETHEUS.LABELS,
      metric,
      this.toContent(timeRange)
    );
  }

  getLabelValues(dataConnectionId: string, label: string, timeRange?: TimeRange) {
    return this.get<string[]>(
      dataConnectionId,
      RESOURCE_TYPES.PROMETHEUS.LABEL_VALUES,
      label,
      this.toContent(timeRange)
    );
  }

  getMetrics(dataConnectionId: string, timeRange?: TimeRange) {
    return this.get<string[]>(
      dataConnectionId,
      RESOURCE_TYPES.PROMETHEUS.METRICS,
      undefined,
      this.toContent(timeRange)
    );
  }

  getMetricMetadata(dataConnectionId: string, metric?: string, timeRange?: TimeRange) {
    return this.get<PrometheusMetricMetadata>(
      dataConnectionId,
      RESOURCE_TYPES.PROMETHEUS.METRIC_METADATA,
      metric,
      this.toContent(timeRange)
    );
  }

  /**
   * Get series data for metrics matching a selector.
   * Returns an array of label sets, where each item contains all labels for a series.
   * @param dataConnectionId - The data connection identifier
   * @param match - The match selector, e.g. '{__name__=~"metric1|metric2"}'
   * @param timeRange - Optional time range
   */
  getSeries(
    dataConnectionId: string,
    match: string,
    timeRange?: TimeRange
  ): Promise<Array<Record<string, string>>> {
    return this.get<Array<Record<string, string>>>(
      dataConnectionId,
      RESOURCE_TYPES.PROMETHEUS.SERIES,
      match,
      this.toContent(timeRange)
    );
  }
}
