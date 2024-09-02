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

interface FlattenedSeriesItem extends SeriesValue {
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

export const flattenDataHandler = (context, dimensions, handlerType = 'series') => {
  // Currently, our vislib only supports 'series' or 'slices' response types.
  // This will need to be updated if more types are added in the future.
  const handler =
    handlerType === 'series' ? vislibSeriesResponseHandler : vislibSlicesResponseHandler;
  const converted = handler(context, dimensions);

  if (handlerType === 'series') {
    // Determine the group based on split dimensions
    const group = dimensions.splitRow
      ? converted.rows
      : dimensions.splitColumn
      ? converted.columns
      : [];

    if (group && group.length !== 0) {
      converted.series = group.flatMap((split) => flattenSeries(split.series, split.label));
      setAxisProperties(converted, group);
    } else {
      converted.series = flattenSeries(converted.series);
    }
  } else if (handlerType === 'slices') {
    // TODO: Handle slices data, such as pie charts
    // This section should be implemented when support for slice-based charts is added
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
