/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilterOperator } from '../types';
import { FilterConfig } from './table_vis_filter';

// Function to calculate luminance of a hex color
export const getLuminance = (hexColor: string): number => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const linearize = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const rL = linearize(r);
  const gL = linearize(g);
  const bL = linearize(b);

  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
};

export const getTextColor = (backgroundColor: string): string => {
  const luminance = getLuminance(backgroundColor);
  // Use white text for dark backgrounds (luminance < 0.5), black for light backgrounds
  return luminance < 0.5 ? '#FFFFFF' : '#000000';
};

export const matchesFilter = (value: any, config: FilterConfig) => {
  const op = config.operator || FilterOperator.Contains;
  const hasValues = Array.isArray(config.values) && config.values.length > 0;
  const hasSearch = typeof config.search === 'string' && config.search.trim() !== '';
  const sVal = value === null ? '' : String(value);
  const sSearch = (config.search || '').trim();
  const toNum = (v: any) => (v === null || v === '' ? NaN : Number(v));

  if (op === FilterOperator.Contains) {
    return !hasSearch || sVal.toLowerCase().includes(sSearch.toLowerCase());
  }

  if (op === FilterOperator.Equals) {
    const matchValues = !hasValues || config.values.includes(value);
    return matchValues;
  }

  if (op === FilterOperator.Equal || op === FilterOperator.NotEqual) {
    if (hasValues) {
      const numValue = toNum(value);
      const numValues = config.values.map(toNum).filter((nv): nv is number => Number.isFinite(nv));
      const hit = numValues.includes(numValue);
      return op === FilterOperator.Equal ? hit : !hit;
    }
    if (hasSearch) {
      const numValue = toNum(value);
      const numSearch = toNum(sSearch);
      if (!Number.isFinite(numValue) || !Number.isFinite(numSearch)) return false;
      const eq = numValue === numSearch;
      return op === FilterOperator.Equal ? eq : !eq;
    }
    return true;
  }

  if (
    op === FilterOperator.GreaterThan ||
    op === FilterOperator.GreaterThanOrEqual ||
    op === FilterOperator.LessThan ||
    op === FilterOperator.LessThanOrEqual
  ) {
    const thresholdStr = hasSearch ? sSearch : hasValues ? String(config.values[0]) : '';
    const nVal = toNum(value);
    const nThr = toNum(thresholdStr);
    if (!Number.isFinite(nVal) || !Number.isFinite(nThr)) return false;

    switch (op) {
      case FilterOperator.GreaterThan:
        return nVal > nThr;
      case FilterOperator.GreaterThanOrEqual:
        return nVal >= nThr;
      case FilterOperator.LessThan:
        return nVal < nThr;
      case FilterOperator.LessThanOrEqual:
        return nVal <= nThr;
    }
  }

  return true;
};
