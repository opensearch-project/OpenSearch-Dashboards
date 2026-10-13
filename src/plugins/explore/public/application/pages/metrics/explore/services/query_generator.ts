/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricType, LabelFilter, inferMetricType } from '../types';

// Escape backslash and double-quote for PromQL label values.
export function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// A metric name PromQL accepts bare.
const PROMQL_METRIC_NAME = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;
// A label name PromQL accepts bare.
const PROMQL_LABEL_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * A label name as PromQL needs it: bare when it can be, else quoted (Prometheus 3 UTF-8 names,
 * e.g. OTel's `"@resource.service.name"` or `"@aws.tag.Team"`).
 */
export function formatLabelName(name: string): string {
  return PROMQL_LABEL_NAME.test(name) ? name : `"${escapeLabelValue(name)}"`;
}

/**
 * The selector for a metric and its label matchers. A name PromQL can't take bare (a leading
 * digit, a dot, as in many non-Prometheus metric names such as `2xx` or `CPU.usage`) goes in a
 * `__name__` matcher instead: `{__name__="2xx"}`.
 */
export function metricSelector(name: string, matchers: string[], separator = ', '): string {
  if (PROMQL_METRIC_NAME.test(name)) {
    return matchers.length ? `${name}{${matchers.join(separator)}}` : name;
  }
  return `{${[`__name__="${escapeLabelValue(name)}"`, ...matchers].join(separator)}}`;
}

/**
 * A histogram whose samples are histograms (native/OTel exponential histograms), not `_bucket`
 * series: the metadata says histogram, but the name is a series of its own. These need histogram
 * functions (`histogram_avg`); aggregations such as `avg` skip histogram samples, and
 * `histogram_quantile(... by (le))` expects classic buckets.
 */
export function isNativeHistogram(name: string, type: MetricType): boolean {
  return type === MetricType.HISTOGRAM && !/_(bucket|count|sum)$/.test(name);
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
    if (isNativeHistogram(name, type)) return `avg(histogram_avg(${selector}))`;
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
    const by = formatLabelName(label);
    if (isNativeHistogram(name, type)) return `avg by (${by}) (histogram_avg(${selector}))`;
    switch (inferMetricType(name, type)) {
      case MetricType.COUNTER:
        return `sum by (${by}) (rate(${selector}[${rate}]))`;
      case MetricType.HISTOGRAM:
        return `histogram_quantile(0.95, sum by (${by}, le) (rate(${selector}[${rate}])))`;
      default:
        return `avg by (${by}) (${selector})`;
    }
  }

  private buildSelector(name: string, filters: LabelFilter[]): string {
    const labelMatchers = filters
      .filter((f) => f.enabled !== false)
      .map((f) => `${formatLabelName(f.name)}${f.operator}"${escapeLabelValue(f.value)}"`);
    return metricSelector(name, labelMatchers, ',');
  }
}
