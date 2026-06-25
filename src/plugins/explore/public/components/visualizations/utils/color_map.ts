/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getColors } from '../theme/default_colors';
import { AxisColumnMappings, AxisRole, VisColumn } from '../types';
import { getSeriesDisplayName } from './series';
import { normalizeEmptyValue } from './data_transformation';

export type ColorMap = Record<string, string>;

export function buildColorMap(seriesNames: string[]): ColorMap {
  const palette = getColors().categories;
  const map: ColorMap = {};
  seriesNames.forEach((name, i) => {
    map[name] = palette[i % palette.length];
  });
  return map;
}

export function extractSeriesNames(
  data: Array<Record<string, any>>,
  axisColumnMappings: AxisColumnMappings,
  chartType: string
): string[] {
  const colorColumns = axisColumnMappings[AxisRole.COLOR];
  const yColumns = axisColumnMappings[AxisRole.Y];
  const y2Columns = axisColumnMappings[AxisRole.Y_SECOND];
  const allColumns = Object.values(axisColumnMappings).flat().filter(Boolean) as VisColumn[];

  if (chartType === 'pie') {
    const colorCol = colorColumns?.[0];
    if (colorCol) {
      const uniqueValues = Array.from(
        new Set(data.map((row) => normalizeEmptyValue(row[colorCol.column])))
      );
      return uniqueValues.sort();
    }
    return [];
  }

  // COLOR axis (pivot-based charts): series names are unique values of the color column
  if (colorColumns && colorColumns.length > 0) {
    const colorCol = colorColumns[0];
    const uniqueValues = Array.from(
      new Set(data.map((row) => normalizeEmptyValue(row[colorCol.column])))
    );
    return uniqueValues.sort();
  }

  // Multi-Y (and Y2) charts: series names are column display names
  const names: string[] = [];
  if (yColumns && yColumns.length > 0) {
    yColumns.forEach((col) => {
      names.push(getSeriesDisplayName(col.column, allColumns));
    });
  }
  if (y2Columns && y2Columns.length > 0) {
    y2Columns.forEach((col) => {
      names.push(getSeriesDisplayName(col.column, allColumns));
    });
  }

  return names.sort();
}
