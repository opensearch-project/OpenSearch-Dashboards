/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../../../../types';
import { MetricMetadata, MetricType, CACHE_TTL_DATA, CACHE_TTL_METADATA } from '../types';
import { LRUCache } from './lru_cache';
import { escapeLabelValue } from './query_generator';

export class PrometheusClient {
  private metadataCache = new LRUCache<any>(CACHE_TTL_METADATA);
  private dataCache = new LRUCache<any>(CACHE_TTL_DATA);
  private activeControllers = new Set<AbortController>();
  private aborted = false;

  constructor(private services: ExploreServices, public readonly dataConnectionId: string) {}

  abort(): void {
    this.aborted = true;
    this.abortActiveControllers();
  }

  clearCache(): void {
    this.metadataCache.clear();
    this.dataCache.clear();
  }

  private abortActiveControllers(): void {
    for (const controller of this.activeControllers) controller.abort();
    this.activeControllers.clear();
  }

  private getResourceClient() {
    return this.services.data.resourceClientFactory.get<any>('prometheus');
  }

  async getMetricNames(): Promise<string[]> {
    const key = `names:${this.dataConnectionId}`;
    const cached = this.metadataCache.get(key);
    if (cached) return cached;
    const rc = this.getResourceClient();
    const names: string[] = await rc.getMetrics(this.dataConnectionId);
    this.metadataCache.set(key, names);
    return names;
  }

  async getMetadata(metric?: string): Promise<Record<string, MetricMetadata>> {
    const key = metric
      ? `metadata:${this.dataConnectionId}:${metric}`
      : `metadata:${this.dataConnectionId}`;
    const cached = this.metadataCache.get(key);
    if (cached) return cached;
    const rc = this.getResourceClient();
    const raw = await rc.getMetricMetadata(this.dataConnectionId, undefined, metric);
    const result: Record<string, MetricMetadata> = {};
    for (const [name, entries] of Object.entries(raw)) {
      const entry = (entries as any[])[0] || {};
      result[name] = {
        name,
        type: (entry.type as MetricType) || MetricType.UNKNOWN,
        help: entry.help || '',
        unit: entry.unit || '',
      };
    }
    this.metadataCache.set(key, result);
    return result;
  }

  async getSeries(match: string): Promise<Array<Record<string, string>>> {
    const key = `series:${this.dataConnectionId}:${match}`;
    const cached = this.dataCache.get(key);
    if (cached) return cached;
    const rc = this.getResourceClient();
    const data = await rc.getSeries(this.dataConnectionId, match);
    this.dataCache.set(key, data);
    return data;
  }

  async getLabelsForMetric(metric: string): Promise<string[]> {
    const key = `labels:${this.dataConnectionId}:${metric}`;
    const cached = this.metadataCache.get(key);
    if (cached) return cached;
    const rc = this.getResourceClient();
    const labels: string[] = await rc.getLabels(this.dataConnectionId, undefined, metric);
    const filtered = labels.filter((l) => l !== '__name__').sort();
    this.metadataCache.set(key, filtered);
    return filtered;
  }

  async getLabelNames(): Promise<string[]> {
    const key = `labelNames:${this.dataConnectionId}`;
    const cached = this.metadataCache.get(key);
    if (cached) return cached;
    const rc = this.getResourceClient();
    const labels: string[] = await rc.getLabels(this.dataConnectionId);
    const filtered = labels.filter((l) => l !== '__name__').sort();
    this.metadataCache.set(key, filtered);
    return filtered;
  }

  async searchMetricNames(search: string, limit = 100): Promise<string[]> {
    const key = `search:${this.dataConnectionId}:${search}`;
    const cached = this.dataCache.get(key);
    if (cached) return cached;

    // Use series API with regex match for server-side filtering.
    // Escape regex metacharacters first, then escape for PromQL string syntax
    // (backslash + double-quote) so the final selector is always well-formed.
    const regexEscaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = `{__name__=~".*${escapeLabelValue(regexEscaped)}.*"}`;
    const series = await this.getSeries(match);
    const nameSet = new Set<string>();
    for (const s of series) {
      if (s.__name__) nameSet.add(s.__name__);
    }
    const names = Array.from(nameSet).sort().slice(0, limit);

    this.dataCache.set(key, names);
    return names;
  }

  async getLabelValues(label: string, metric?: string): Promise<string[]> {
    const key = `lv:${this.dataConnectionId}:${label}:${metric || ''}`;
    const cached = this.dataCache.get(key);
    if (cached) return cached;
    const rc = this.getResourceClient();
    const meta = metric ? { 'match[]': `{__name__="${escapeLabelValue(metric)}"}` } : undefined;
    const data = await rc.getLabelValues(this.dataConnectionId, meta, label);
    this.dataCache.set(key, data);
    return data;
  }

  async queryRange(promql: string, signal?: AbortSignal): Promise<any> {
    if (this.aborted) return [];
    const timeRange = this.services.data.query.timefilter.timefilter.getTime();
    const key = `qr:${this.dataConnectionId}:${timeRange.from}:${timeRange.to}:${promql}`;
    const cached = this.dataCache.get(key);
    if (cached) return cached;
    return this.executeQueryRange(promql, key, signal);
  }

  private async resolveDataView() {
    const queryState = this.services.data.query.queryString.getQuery();
    if (queryState.dataset) {
      return this.services.data.dataViews.get(
        queryState.dataset.id,
        queryState.dataset.type !== 'INDEX_PATTERN'
      );
    }
    return this.services.data.dataViews.getDefault();
  }

  private async executeQueryRange(
    promql: string,
    cacheKey: string,
    signal?: AbortSignal
  ): Promise<any> {
    const dataView = await this.resolveDataView();
    if (!dataView) return [];

    const queryState = this.services.data.query.queryString.getQuery();
    const dataset = await this.services.data.dataViews.convertToDataset(dataView);
    const searchSource = await this.services.data.search.searchSource.create();
    searchSource.setFields({
      index: dataView,
      size: 2000,
      query: { ...queryState, dataset, query: promql },
      highlightAll: false,
      version: false,
    });

    const controller = new AbortController();
    this.activeControllers.add(controller);
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

    try {
      const rawResults = await searchSource.fetch({ abortSignal: controller.signal });
      const result = this.transformHitsToSeries(rawResults?.hits?.hits || []);
      if (!this.aborted && !controller.signal.aborted) {
        this.dataCache.set(cacheKey, result);
      }
      return result;
    } catch (err) {
      if (!controller.signal.aborted) {
        // eslint-disable-next-line no-console
        console.error('PrometheusClient.executeQueryRange failed', err);
      }
      return [];
    } finally {
      clearTimeout(timeoutId);
      this.activeControllers.delete(controller);
    }
  }

  private transformHitsToSeries(hits: any[]): any[] {
    const seriesMap = new Map<
      string,
      { labels: Record<string, string>; values: Array<[number, string]> }
    >();
    for (const hit of hits) {
      const src = hit._source || {};
      const seriesName = String(src.Series || src.Metric || '');
      const time = Number(src.Time) / 1000;
      const value = String(src.Value ?? '');
      if (!seriesMap.has(seriesName)) {
        seriesMap.set(seriesName, { labels: this.parseSeriesLabels(seriesName), values: [] });
      }
      seriesMap.get(seriesName)!.values.push([time, value]);
    }
    return Array.from(seriesMap.entries()).map(([name, { labels, values }]) => ({
      metric: { __name__: name, ...labels },
      values,
    }));
  }

  private parseSeriesLabels(series: string): Record<string, string> {
    const braceStart = series.indexOf('{');
    if (braceStart === -1) return {};
    const braceContent = series.slice(braceStart + 1, series.lastIndexOf('}'));
    const labels: Record<string, string> = {};
    for (const match of braceContent.matchAll(/(\w+)="([^"]*)"/g)) {
      labels[match[1]] = match[2];
    }
    return labels;
  }
}
