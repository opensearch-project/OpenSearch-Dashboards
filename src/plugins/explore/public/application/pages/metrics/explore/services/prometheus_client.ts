/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../../../../types';
import { MetricMetadata, MetricType, CACHE_TTL_DATA, CACHE_TTL_METADATA } from '../types';
import { LRUCache } from './lru_cache';
import { escapeLabelValue } from './query_generator';

export interface QueryRangeSeries {
  metric: Record<string, string>;
  values: Array<[number, string]>;
}

interface TimeRange {
  from: string;
  to: string;
}

interface PrometheusResourceClientLike {
  getMetrics(
    dataConnectionId: string,
    meta?: Record<string, unknown>,
    timeRange?: TimeRange
  ): Promise<string[]>;
  getMetricMetadata(
    dataConnectionId: string,
    meta: Record<string, unknown> | undefined,
    metric?: string,
    timeRange?: TimeRange
  ): Promise<Record<string, Array<{ type?: string; help?: string; unit?: string }>>>;
  getSeries(
    dataConnectionId: string,
    match: string,
    meta?: Record<string, unknown>,
    timeRange?: TimeRange
  ): Promise<Array<Record<string, string>>>;
  getLabels(
    dataConnectionId: string,
    meta?: Record<string, unknown>,
    metric?: string,
    timeRange?: TimeRange
  ): Promise<string[]>;
  getLabelValues(
    dataConnectionId: string,
    meta: Record<string, unknown> | undefined,
    label: string,
    timeRange?: TimeRange
  ): Promise<string[]>;
}

interface PrometheusSearchHit {
  _source?: {
    Series?: string;
    Metric?: string;
    Time?: number | string;
    Value?: number | string;
    Labels?: Record<string, string>;
  };
}

export class PrometheusClient {
  private metadataCache = new LRUCache<unknown>(CACHE_TTL_METADATA);
  private dataCache = new LRUCache<unknown>(CACHE_TTL_DATA);
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

  private getResourceClient(): PrometheusResourceClientLike {
    const rc = this.services.data.resourceClientFactory.get<PrometheusResourceClientLike>(
      'prometheus'
    );
    if (!rc) throw new Error('Prometheus resource client is not registered');
    return rc;
  }

  // Resource-API endpoints (metadata, labels, series) honor start/end on the
  // Prometheus side — without them the server returns results spanning full
  // retention and the browser shows metrics/labels that aren't live for the
  // current time range. Include the raw (unresolved) range in cache keys so
  // relative ranges stay stable across equivalent clicks.
  private getTimeRange() {
    return this.services.data.query.timefilter.timefilter.getTime();
  }

  private timeRangeKey() {
    const tr = this.getTimeRange();
    return `${tr.from}:${tr.to}`;
  }

  async getMetricNames(): Promise<string[]> {
    const key = `names:${this.dataConnectionId}:${this.timeRangeKey()}`;
    const cached = this.metadataCache.get(key) as string[] | undefined;
    if (cached) return cached;
    const rc = this.getResourceClient();
    const names = await rc.getMetrics(this.dataConnectionId, undefined, this.getTimeRange());
    this.metadataCache.set(key, names);
    return names;
  }

  async getMetadata(metric?: string): Promise<Record<string, MetricMetadata>> {
    const tk = this.timeRangeKey();
    const key = metric
      ? `metadata:${this.dataConnectionId}:${tk}:${metric}`
      : `metadata:${this.dataConnectionId}:${tk}`;
    const cached = this.metadataCache.get(key) as Record<string, MetricMetadata> | undefined;
    if (cached) return cached;
    const rc = this.getResourceClient();
    const raw = await rc.getMetricMetadata(
      this.dataConnectionId,
      undefined,
      metric,
      this.getTimeRange()
    );
    const result: Record<string, MetricMetadata> = {};
    for (const [name, entries] of Object.entries(raw)) {
      const entry = entries[0] || {};
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
    const key = `series:${this.dataConnectionId}:${this.timeRangeKey()}:${match}`;
    const cached = this.dataCache.get(key) as Array<Record<string, string>> | undefined;
    if (cached) return cached;
    const rc = this.getResourceClient();
    const data = await rc.getSeries(this.dataConnectionId, match, undefined, this.getTimeRange());
    this.dataCache.set(key, data);
    return data;
  }

  async getLabelsForMetric(metric: string): Promise<string[]> {
    const key = `labels:${this.dataConnectionId}:${this.timeRangeKey()}:${metric}`;
    const cached = this.metadataCache.get(key) as string[] | undefined;
    if (cached) return cached;
    const rc = this.getResourceClient();
    const labels = await rc.getLabels(
      this.dataConnectionId,
      undefined,
      metric,
      this.getTimeRange()
    );
    const filtered = labels.filter((l) => l !== '__name__').sort();
    this.metadataCache.set(key, filtered);
    return filtered;
  }

  async getLabelNames(): Promise<string[]> {
    const key = `labelNames:${this.dataConnectionId}:${this.timeRangeKey()}`;
    const cached = this.metadataCache.get(key) as string[] | undefined;
    if (cached) return cached;
    const rc = this.getResourceClient();
    const labels = await rc.getLabels(
      this.dataConnectionId,
      undefined,
      undefined,
      this.getTimeRange()
    );
    const filtered = labels.filter((l) => l !== '__name__').sort();
    this.metadataCache.set(key, filtered);
    return filtered;
  }

  async searchMetricNames(search: string, limit = 100): Promise<string[]> {
    const key = `search:${this.dataConnectionId}:${this.timeRangeKey()}:${search}`;
    const cached = this.dataCache.get(key) as string[] | undefined;
    if (cached) return cached;

    // Use label values API (/api/v1/label/__name__/values) with match[] filter
    // instead of series API to avoid fetching full label sets for every series.
    const regexEscaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = `{__name__=~".*${escapeLabelValue(regexEscaped)}.*"}`;
    const rc = this.getResourceClient();
    const names: string[] = await rc.getLabelValues(
      this.dataConnectionId,
      { 'match[]': match },
      '__name__',
      this.getTimeRange()
    );
    const sorted = names.sort().slice(0, limit);

    this.dataCache.set(key, sorted);
    return sorted;
  }

  async getLabelValues(label: string, metric?: string): Promise<string[]> {
    const key = `lv:${this.dataConnectionId}:${this.timeRangeKey()}:${label}:${metric || ''}`;
    const cached = this.dataCache.get(key) as string[] | undefined;
    if (cached) return cached;
    const rc = this.getResourceClient();
    const meta = metric ? { 'match[]': `{__name__="${escapeLabelValue(metric)}"}` } : undefined;
    const data = await rc.getLabelValues(this.dataConnectionId, meta, label, this.getTimeRange());
    this.dataCache.set(key, data);
    return data;
  }

  async queryRange(promql: string, signal?: AbortSignal): Promise<QueryRangeSeries[]> {
    if (this.aborted) return [];
    const timeRange = this.services.data.query.timefilter.timefilter.getTime();
    const key = `qr:${this.dataConnectionId}:${timeRange.from}:${timeRange.to}:${promql}`;
    const cached = this.dataCache.get(key) as QueryRangeSeries[] | undefined;
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
  ): Promise<QueryRangeSeries[]> {
    if (signal?.aborted) return [];

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
      const hits = ((rawResults?.hits?.hits ?? []) as unknown) as PrometheusSearchHit[];
      const result = this.transformHitsToSeries(hits);
      if (!this.aborted && !controller.signal.aborted) {
        this.dataCache.set(cacheKey, result);
      }
      return result;
    } catch (err) {
      if (controller.signal.aborted) return [];
      throw err;
    } finally {
      clearTimeout(timeoutId);
      this.activeControllers.delete(controller);
    }
  }

  // Groups hits back into series. Relies on the server (promql_search_strategy)
  // emitting a structured `Labels` object per row, so we never parse labels out
  // of the formatted `Series` string.
  private transformHitsToSeries(hits: PrometheusSearchHit[]): QueryRangeSeries[] {
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
        const labels =
          src.Labels && typeof src.Labels === 'object'
            ? src.Labels
            : ({} as Record<string, string>);
        seriesMap.set(seriesName, { labels, values: [] });
      }
      seriesMap.get(seriesName)!.values.push([time, value]);
    }
    return Array.from(seriesMap.entries()).map(([name, { labels, values }]) => ({
      metric: { __name__: name, ...labels },
      values,
    }));
  }
}
