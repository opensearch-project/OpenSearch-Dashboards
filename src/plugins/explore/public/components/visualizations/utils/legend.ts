/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeEmptyValue } from './data_transformation';
import { getSeriesDisplayName } from './series';
import { VisColumn } from '../types';

export interface LegendItem {
  label: string;
  color: string;
  target: LegendTarget;
}

export type LegendTarget =
  { type: 'series'; name: string } | { type: 'data'; name: string; seriesIndex?: number };

export const getLegendTargetKey = (target: LegendTarget) =>
  `${target.type}:${target.type === 'data' ? (target.seriesIndex ?? 0) : ''}:${target.name}`;

export const getLegendItemSelectionName = (item: LegendItem) => item.target.name;

export const createSeriesLegendItem = (name: string, color: string, label = name): LegendItem => ({
  label,
  color,
  target: { type: 'series', name },
});

export const createDataLegendItem = (
  name: string,
  color: string,
  seriesIndex = 0,
  label = name
): LegendItem => ({
  label,
  color,
  target: { type: 'data', name, seriesIndex },
});

export const dedupeLegendItems = (items: LegendItem[]) => {
  const deduped = new Map<string, LegendItem>();
  items.forEach((item) => {
    const key = getLegendTargetKey(item.target);
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  });
  return [...deduped.values()].sort((a, b) => a.label.localeCompare(b.label));
};

export const getLegendColor = (name: unknown, palette: string[], colorDomain: unknown[]) => {
  const normalizedName = normalizeEmptyValue(name);
  const normalizedDomain = colorDomain.map(normalizeEmptyValue);
  const colorIndex = normalizedDomain.indexOf(normalizedName);
  return palette[(colorIndex >= 0 ? colorIndex : 0) % palette.length];
};

export const getLegendNameDomain = ({
  data,
  nameField,
  seriesFields,
  columns,
}: {
  data?: Array<Record<string, any>>;
  nameField?: string;
  seriesFields: string[];
  columns: VisColumn[];
}) => {
  if (data && nameField) {
    return Array.from(new Set(data.map((d) => normalizeEmptyValue(d[nameField])))).sort();
  }

  return seriesFields.map((field) => getSeriesDisplayName(field, columns)).sort();
};
