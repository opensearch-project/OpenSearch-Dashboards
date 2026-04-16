/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricType, LabelFilter, inferMetricType } from './types';

export class MetricQueryGenerator {
  constructor(private scrapeInterval: string = '15s', private stepInterval: string = '15s') {}

  // Match Grafana's $__rate_interval: max(4 * scrapeInterval, step + scrapeInterval)
  public get rateInterval(): string {
    const scrape = this.parseToSeconds(this.scrapeInterval);
    const step = this.parseToSeconds(this.stepInterval);
    const rateSeconds = Math.max(scrape * 4, step + scrape);
    return rateSeconds >= 60 ? `${rateSeconds / 60}m` : `${rateSeconds}s`;
  }

  forMetric(name: string, type: MetricType, filters: LabelFilter[] = []): string {
    const selector = this.buildSelector(name, filters);
    switch (inferMetricType(name, type)) {
      case MetricType.COUNTER:
        return `sum(rate(${selector}[${this.rateInterval}]))`;
      case MetricType.HISTOGRAM:
        return `histogram_quantile(0.95, sum(rate(${selector}[${this.rateInterval}])) by (le))`;
      default:
        return `avg(${selector})`;
    }
  }

  forSparkline(name: string, type: MetricType, filters: LabelFilter[] = []): string {
    return this.forMetric(name, type, filters);
  }

  forBreakdown(name: string, type: MetricType, label: string, filters: LabelFilter[] = []): string {
    const selector = this.buildSelector(name, filters);
    switch (inferMetricType(name, type)) {
      case MetricType.COUNTER:
        return `sum by (${label}) (rate(${selector}[${this.rateInterval}]))`;
      case MetricType.HISTOGRAM:
        return `histogram_quantile(0.95, sum by (${label}, le) (rate(${selector}[${this.rateInterval}])))`;
      default:
        return `avg by (${label}) (${selector})`;
    }
  }

  private buildSelector(name: string, filters: LabelFilter[]): string {
    const labelMatchers = filters
      .filter((f) => f.enabled !== false)
      .map((f) => `${f.name}${f.operator}"${f.value}"`)
      .join(',');
    return labelMatchers ? `${name}{${labelMatchers}}` : name;
  }

  private parseToSeconds(interval: string): number {
    const match = interval.match(/^(\d+)([smhd])$/);
    if (!match) return 60;
    const [, num, unit] = match;
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(num, 10) * (multipliers[unit] || 60);
  }
}
