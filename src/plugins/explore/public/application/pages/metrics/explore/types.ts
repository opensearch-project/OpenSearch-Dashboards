/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ExplorationLevel {
  BROWSER = 'browser',
  DETAIL = 'detail',
  BREAKDOWN = 'breakdown',
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
  UNKNOWN = 'unknown',
}

export enum GroupingStrategy {
  PREFIX = 'prefix',
  ALPHABETICAL = 'alphabetical',
}

export enum LayoutMode {
  GRID = 'grid',
  ROWS = 'rows',
}

export interface ExplorationState {
  level: ExplorationLevel;
  search: string;
  metric: string;
  label: string;
  filters: LabelFilter[];
  grouping: GroupingStrategy;
  layout: LayoutMode;
}

export interface LabelFilter {
  name: string;
  operator: '=' | '!=' | '=~' | '!~';
  value: string;
  enabled?: boolean;
}

export interface MetricMetadata {
  name: string;
  type: MetricType;
  help: string;
  unit: string;
}

export interface LabelInfo {
  name: string;
  cardinality: number;
}

export const CACHE_TTL_DATA = 60_000;
export const CACHE_TTL_METADATA = 300_000;
export const CACHE_MAX_ENTRIES = 500;
export const SEARCH_DEBOUNCE_MS = 300;

export function inferMetricType(name: string, type: MetricType): MetricType {
  if (type !== MetricType.UNKNOWN) return type;
  if (/_total$|_count$|_sum$|_created$/.test(name)) return MetricType.COUNTER;
  if (/_bucket$/.test(name)) return MetricType.HISTOGRAM;
  return type;
}

export const TYPE_COLORS: Record<MetricType, string> = {
  [MetricType.COUNTER]: 'primary',
  [MetricType.GAUGE]: 'success',
  [MetricType.HISTOGRAM]: 'warning',
  [MetricType.SUMMARY]: 'accent',
  [MetricType.UNKNOWN]: 'default',
};

export const breakdownGridStyle = (layout: LayoutMode) => ({
  display: 'grid' as const,
  gridTemplateColumns: layout === LayoutMode.ROWS ? '1fr' : 'repeat(auto-fill, minmax(400px, 1fr))',
  gap: 8,
});
