/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  vislibSeriesResponseHandler,
  vislibSlicesResponseHandler,
} from '../../../../../vis_type_vislib/public';
import { AxisFormats } from './types';

/**
 * Sets axis properties (Format and Label) for x, y, and z axes
 * @param {Object} converted - The object to set properties on
 * @param {Array} group - The group containing axis information
 */
const setAxisProperties = (converted: any, group: any[]): void => {
  const axes = ['xAxis', 'yAxis', 'zAxis'];
  const properties = ['Format', 'Label'];

  axes.forEach((axis) => {
    properties.forEach((prop) => {
      const key = `${axis}${prop}` as keyof AxisFormats;
      converted[key] = group[0][key];
    });
  });
};

interface SeriesValue {
  x: any;
  y: any;
  z?: any;
}

interface Series {
  label: string;
  values: SeriesValue[];
}

export interface FlattenedSeriesItem extends SeriesValue {
  series: string;
  split?: string;
}

/**
 * Flattens series data into a single array of data points
 * @param {Series} series - The series data to flatten
 * @param {string|null} splitLabel - The label for the split, if any
 * @returns {FlattenedSeriesItem} Flattened array of data points
 */
const flattenSeries = (
  series: Series[],
  splitLabel: string | null = null
): FlattenedSeriesItem[] => {
  return series.flatMap((s) => {
    if (!s.values || !Array.isArray(s.values)) {
      throw new Error('Each series must have a "values" array');
    }

    return s.values.map(
      (v): FlattenedSeriesItem => {
        const baseItem: FlattenedSeriesItem = {
          x: v.x,
          y: v.y,
          series: s.label,
        };

        if (v.z !== undefined) {
          baseItem.z = v.z;
        }

        if (splitLabel) {
          baseItem.split = splitLabel;
        }

        return baseItem;
      }
    );
  });
};

export interface FlattenedSliceItem {
  [key: string]: any;
  value: number;
  split?: string;
}

export interface FlattenHierarchyResult {
  flattenedData: FlattenedSliceItem[];
  levels: string[];
}

/**
 * Flattens hierarchical slice data into a single array of data points
 * @param {any} data - The hierarchical data to flatten
 * @param {any[]} group - The group data (rows or columns) if split dimensions exist
 * @returns {FlattenedSliceItem[]} Flattened array of data points
 */
const flattenHierarchy = (data, group): FlattenHierarchyResult => {
  const flattenedData: FlattenedSliceItem[] = [];
  const levelSet = new Set<string>();

  const flattenSlices = (
    slices: any,
    split?: string,
    level = 1,
    parentLabels: { [key: string]: string } = {}
  ) => {
    slices.children.forEach((child: any) => {
      const currentLabels = { ...parentLabels, [`level${level}`]: child.name };
      levelSet.add(`level${level}`);

      if (Array.isArray(child.children) && child.children.length > 0) {
        flattenSlices(child, split, level + 1, currentLabels);
      } else {
        const dataPoint: FlattenedSliceItem = {
          ...currentLabels,
          value: child.size !== undefined ? child.size : null,
        };
        if (split !== undefined) {
          dataPoint.split = split;
        }
        flattenedData.push(dataPoint);
      }
    });
  };

  if (Array.isArray(group) && group.length !== 0) {
    group.forEach((splitData) => {
      flattenSlices(splitData.slices, splitData.label);
    });
  } else {
    flattenSlices(data.slices, undefined);
  }

  return { flattenedData, levels: Array.from(levelSet) };
};

/**
 * Handles the flattening of data for different chart types
 * @param {any} context - The context object containing the data
 * @param {any} dimensions - The dimensions object defining the chart structure
 * @param {'series' | 'slices'} handlerType - The type of chart data to handle
 * @returns {any} Converted and flattened data suitable for visualization
 */
export const flattenDataHandler = (context, dimensions, handlerType = 'series') => {
  // TODO: Update this func if more types are added in the future.
  const handler =
    handlerType === 'series' ? vislibSeriesResponseHandler : vislibSlicesResponseHandler;
  const converted = handler(context, dimensions);
  const group = dimensions.splitRow
    ? converted.rows
    : dimensions.splitColumn
    ? converted.columns
    : [];

  if (handlerType === 'series') {
    // Determine the group based on split dimensions
    if (Array.isArray(group) && group.length !== 0) {
      converted.series = group.flatMap((split) => flattenSeries(split.series, split.label));
      setAxisProperties(converted, group);
    } else {
      converted.series = flattenSeries(converted.series);
    }
  } else if (handlerType === 'slices') {
    const { flattenedData, levels } = flattenHierarchy(converted, group);
    converted.slices = flattenedData;
    converted.levels = levels;
  }

  return converted;
};

/**
 * Maps OpenSearch field types to Vega data types
 * @param {string} fieldType - The OpenSearch field type
 * @returns {string} The corresponding Vega data type
 */
export const mapFieldTypeToVegaType = (fieldType) => {
  const typeMap = {
    number: 'quantitative',
    date: 'temporal',
    time: 'temporal',
    terms: 'nominal',
    keyword: 'nominal',
    ip: 'nominal',
    boolean: 'nominal',
    histogram: 'quantitative',
  };

  // Default to 'nominal' if the field type is not recognized
  return typeMap[fieldType] || 'nominal';
};

/**
 * Maps chart types to Vega mark types
 * @param {string} chartType - The chart type
 * @returns {string} The corresponding Vega mark type
 */
export const mapChartTypeToVegaType = (chartType) =>
  chartType === 'histogram' ? 'bar' : chartType;
