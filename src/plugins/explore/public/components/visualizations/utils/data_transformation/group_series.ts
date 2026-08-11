/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { normalizeEmptyValue } from './utils/normalization';

/**
 * Split rows into one group per value of `groupField`, keeping each group on its own
 * timeline.
 *
 * GroupSeries is different with pivot which forces a null into every series that did not report at another series' timestamp.
 * Those nulls read as breaks, so a line could be cut apart by a neighbour's sampling point.
 */
export interface SeriesGroup {
  name: string;
  rows: Array<Record<string, any>>;
}

export const groupSeries = (
  data: Array<Record<string, any>>,
  { groupField, valueField }: { groupField: string; valueField: string }
): SeriesGroup[] => {
  const groups = new Map<string, Array<Record<string, any>>>();

  data.forEach((row) => {
    const name = String(normalizeEmptyValue(row[groupField]));
    const rawValue = row[valueField];
    const isMissing = rawValue === null || rawValue === undefined || rawValue === '';
    const value = isMissing || isNaN(Number(rawValue)) ? null : Number(rawValue);

    if (!groups.has(name)) {
      groups.set(name, []);
    }
    groups.get(name)?.push({ ...row, [valueField]: value });
  });

  return [...groups.keys()].sort().map((name) => ({ name, rows: groups.get(name) ?? [] }));
};

/**
 * Build and transform one dataset per series
 */
export const groupSeriesDatasets =
  ({
    groupField,
    valueField,
    timeField,
    perSeries,
  }: {
    groupField: string;
    valueField: string;
    timeField: string;
    perSeries?: (rows: Array<Record<string, any>>) => Array<Record<string, any>>;
  }) =>
  (data: Array<Record<string, any>>): Array<Array<string[] | any[]>> => {
    const groups = groupSeries(data, { groupField, valueField });

    return groups.map(({ rows }) => {
      const prepared = perSeries ? perSeries(rows) : rows;
      const headers = [timeField, valueField];
      return [headers, ...prepared.map((row) => headers.map((header) => row[header]))];
    });
  };
