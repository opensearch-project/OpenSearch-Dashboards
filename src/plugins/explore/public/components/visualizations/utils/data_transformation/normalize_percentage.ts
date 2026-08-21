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
