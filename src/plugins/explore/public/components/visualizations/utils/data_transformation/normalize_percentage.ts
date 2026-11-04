/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StackMode } from '../../types';

export const resolveStackMode = (styles: { stackMode?: StackMode | undefined }): StackMode =>
  styles.stackMode ?? 'none';

/**
 * stacked and normalized so each data point sums to 100% or -100%
 * @param excludeFields Fields that are not series values (e.g. the x-axis column).
 */
export const normalizeToPercentage =
  ({ excludeFields = [] }: { excludeFields?: string[] }) =>
  (data: Array<Record<string, any>>): Array<Record<string, any>> => {
    return data.map((row) => {
      const seriesFields = Object.keys(row).filter((key) => !excludeFields.includes(key));

      // The row total sums absolute values rather than signed ones.
      // each value lands within [-100%, 100%] while ensure row stays readable
      // for example: ({a: 100, b: -30} -> 77% / -23%).
      const total = seriesFields.reduce((sum, field) => {
        const value = Number(row[field]);
        return Number.isFinite(value) ? sum + Math.abs(value) : sum;
      }, 0);

      const newRow = { ...row };
      seriesFields.forEach((field) => {
        const value = Number(newRow[field]);
        if (newRow[field] === null || newRow[field] === undefined || !Number.isFinite(value)) {
          return;
        }
        newRow[field] = total === 0 ? 0 : value / total;
      });
      return newRow;
    });
  };

export const transformStackPercentage =
  (styles: { stackMode?: StackMode | undefined }, options: { excludeFields?: string[] }) =>
  (data: Array<Record<string, any>>): Array<Record<string, any>> =>
    resolveStackMode(styles) === 'percentage' ? normalizeToPercentage(options)(data) : data;

export const transformDatasetsStackPercentage =
  (styles: { stackMode?: StackMode | undefined }) =>
  (data: Array<Record<string, any>>): Array<Record<string, any>> =>
    resolveStackMode(styles) === 'percentage'
      ? normalizeDatasetsToPercentage()(data as Array<Array<string[] | any[]>>)
      : data;

/**
 * Percentage-normalize the multi-dataset, where each series is its own dataset: [ [timeField, valueCol], [t, v], … ].
 *
 * Unlike normalizeToPercentage (wide rows, one row per timestamp), here each timestamp's total must be
 * summed ACROSS the datasets. Each dataset then keeps only its own rows/timestamps — no union padding —
 * with every value divided by that timestamp's cross-dataset total.
 */
export const normalizeDatasetsToPercentage =
  () =>
  (datasets: Array<Array<string[] | any[]>>): Array<Array<string[] | any[]>> => {
    if (datasets.length === 0) return datasets;

    // 1. get the value sum across all datasets at each timestamp.
    const totalByTime = new Map<string, number>();
    datasets.forEach((ds) => {
      ds.slice(1).forEach(([time, value]) => {
        if (!Number.isFinite(value)) return;
        const key = String(time);
        totalByTime.set(key, (totalByTime.get(key) ?? 0) + Math.abs(value));
      });
    });

    // 2. each dataset keeps only its own rows (its own timestamps, in order) with value being normalized.
    // gaps (null) pass through untouched so disconnect breaks stay
    const result = datasets.map((ds) => {
      const header = ds[0];
      const rows = ds.slice(1).map(([time, value]) => {
        if (!Number.isFinite(value)) return [time, value];
        const total = totalByTime.get(String(time)) ?? 0;
        return [time, total === 0 ? 0 : value / total];
      });
      return [header, ...rows];
    });

    return result;
  };
