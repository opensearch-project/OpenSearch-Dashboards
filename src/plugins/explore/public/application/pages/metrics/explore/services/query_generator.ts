/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricType, LabelFilter, inferMetricType } from '../types';

// Escape backslash and double-quote for PromQL label values.
export function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Assumed Prometheus scrape interval when building rate windows. 60s covers
// typical deployments (15s–60s scrapes) without requiring per-datasource config.
const ASSUMED_SCRAPE_SEC = 60;

export class MetricQueryGenerator {
  public rateInterval(stepSec: number): string {
    const rateSec = Math.max(ASSUMED_SCRAPE_SEC * 4, stepSec + ASSUMED_SCRAPE_SEC);
    if (rateSec >= 60 && rateSec % 60 === 0) return `${rateSec / 60}m`;
    return `${rateSec}s`;
  }

  forMetric(name: string, type: MetricType, stepSec: number, filters: LabelFilter[] = []): string {
    const selector = this.buildSelector(name, filters);
    const rate = this.rateInterval(stepSec);
    switch (inferMetricType(name, type)) {
      case MetricType.COUNTER:
        return `sum(rate(${selector}[${rate}]))`;
      case MetricType.HISTOGRAM:
        return `histogram_quantile(0.95, sum(rate(${selector}[${rate}])) by (le))`;
      default:
        return `avg(${selector})`;
    }
  }

  forSparkline(
    name: string,
    type: MetricType,
    stepSec: number,
    filters: LabelFilter[] = []
  ): string {
    return this.forMetric(name, type, stepSec, filters);
  }

  forBreakdown(
    name: string,
    type: MetricType,
    label: string,
    stepSec: number,
    filters: LabelFilter[] = []
  ): string {
    const selector = this.buildSelector(name, filters);
    const rate = this.rateInterval(stepSec);
    switch (inferMetricType(name, type)) {
      case MetricType.COUNTER:
        return `sum by (${label}) (rate(${selector}[${rate}]))`;
      case MetricType.HISTOGRAM:
        return `histogram_quantile(0.95, sum by (${label}, le) (rate(${selector}[${rate}])))`;
      default:
        return `avg by (${label}) (${selector})`;
    }
  }

  private buildSelector(name: string, filters: LabelFilter[]): string {
    const labelMatchers = filters
      .filter((f) => f.enabled !== false)
      .map((f) => `${f.name}${f.operator}"${escapeLabelValue(f.value)}"`)
      .join(',');
    return labelMatchers ? `${name}{${labelMatchers}}` : name;
  }
}
