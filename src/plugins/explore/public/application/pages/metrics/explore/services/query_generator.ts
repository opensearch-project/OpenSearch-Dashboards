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

// Default number of datapoints per chart; step = duration / resolution.
const DEFAULT_RESOLUTION = 1440;
const MIN_STEP_INTERVAL = 15;

function roundInterval(intervalMs: number): number {
  if (intervalMs <= 1) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(intervalMs)));
  const normalized = intervalMs / magnitude;
  let nice: number;
  if (normalized <= 1) nice = 1;
  else if (normalized <= 2) nice = 2;
  else if (normalized <= 5) nice = 5;
  else nice = 10;
  return Math.round(nice * magnitude);
}

// Mirrors the server-side calculateStep in query_enhancements/server/search/prom_utils.ts
// so client-rendered rate windows align with server-selected step intervals.
export function calculateStep(durationMs: number): number {
  const rawIntervalMs = durationMs / DEFAULT_RESOLUTION;
  const stepSec = roundInterval(rawIntervalMs) / 1000;
  return Math.max(stepSec, MIN_STEP_INTERVAL);
}

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
