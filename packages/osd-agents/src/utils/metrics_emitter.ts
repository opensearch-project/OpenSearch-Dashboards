/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * PrometheusMetricsEmitter for Prometheus-compatible metrics
 * Writes metrics to a separate file that can be scraped by Prometheus
 */
export class PrometheusMetricsEmitter {
  private static instance: PrometheusMetricsEmitter;
  private metricsFilePath: string;
  private metricsStream: fs.WriteStream | null = null;

  private constructor() {
    // Create metrics directory at the same level as logs
    const metricsDir = path.join(process.cwd(), 'metrics');
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }

    // Create metrics file with timestamp (same format as logs)
    const timestamp = new Date().toISOString().split('T')[0];
    this.metricsFilePath = path.join(metricsDir, `agent-metrics-${timestamp}.prom`);

    // Open stream for appending metrics
    this.metricsStream = fs.createWriteStream(this.metricsFilePath, { flags: 'a' });

    // Write header with metadata
    this.writeHeader();
  }

  public static getInstance(): PrometheusMetricsEmitter {
    if (!PrometheusMetricsEmitter.instance) {
      PrometheusMetricsEmitter.instance = new PrometheusMetricsEmitter();
    }
    return PrometheusMetricsEmitter.instance;
  }

  private writeHeader(): void {
    const header = [
      '# HELP langgraph_agent_max_iterations_reached_total Number of times max iterations was reached',
      '# TYPE langgraph_agent_max_iterations_reached_total counter',
      '# HELP langgraph_agent_redundant_tool_calls_total Number of redundant tool calls attempted',
      '# TYPE langgraph_agent_redundant_tool_calls_total counter',
      '# HELP langgraph_agent_tool_execution_duration_seconds Time taken to execute tools',
      '# TYPE langgraph_agent_tool_execution_duration_seconds histogram',
      '# HELP langgraph_agent_iterations_per_request Number of iterations per request',
      '# TYPE langgraph_agent_iterations_per_request histogram',
      '',
    ].join('\n');

    this.metricsStream?.write(header + '\n');
  }

  /**
   * Emit a counter metric (for counting events)
   */
  public emitCounter(metricName: string, value: number = 1, labels?: Record<string, string>): void {
    const labelString = this.formatLabels(labels);
    const metric = `${metricName}${labelString} ${value} ${Date.now()}\n`;
    this.metricsStream?.write(metric);
  }

  /**
   * Emit a gauge metric (for current values)
   */
  public emitGauge(metricName: string, value: number, labels?: Record<string, string>): void {
    const labelString = this.formatLabels(labels);
    const metric = `${metricName}${labelString} ${value} ${Date.now()}\n`;
    this.metricsStream?.write(metric);
  }

  /**
   * Emit a histogram metric (for distributions)
   */
  public emitHistogram(metricName: string, value: number, labels?: Record<string, string>): void {
    const labelString = this.formatLabels(labels);

    // Emit sum and count for histogram
    const sumMetric = `${metricName}_sum${labelString} ${value} ${Date.now()}\n`;
    const countMetric = `${metricName}_count${labelString} 1 ${Date.now()}\n`;

    // Emit bucket values (simplified - you might want more buckets)
    const buckets = [0.1, 0.5, 1, 2, 5, 10, 30, 60];
    for (const bucket of buckets) {
      if (value <= bucket) {
        const bucketMetric = `${metricName}_bucket${this.formatLabels({
          ...labels,
          le: bucket.toString(),
        })} 1 ${Date.now()}\n`;
        this.metricsStream?.write(bucketMetric);
      }
    }

    this.metricsStream?.write(sumMetric);
    this.metricsStream?.write(countMetric);
  }

  /**
   * Format labels for Prometheus format
   */
  private formatLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }

    const labelPairs = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');

    return `{${labelPairs}}`;
  }

  /**
   * Close the metrics stream
   */
  public close(): void {
    if (this.metricsStream) {
      this.metricsStream.end();
      this.metricsStream = null;
    }
  }

  /**
   * Get the path to the current metrics file
   */
  public getMetricsFilePath(): string {
    return this.metricsFilePath;
  }
}

// Export singleton instance getter
export const getPrometheusMetricsEmitter = () => PrometheusMetricsEmitter.getInstance();
