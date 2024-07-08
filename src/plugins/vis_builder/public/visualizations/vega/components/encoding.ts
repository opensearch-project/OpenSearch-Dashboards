/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mapFieldTypeToVegaType } from '../utils/helpers';
import { AxisFormats } from '../utils/types';

interface EncodingChannel {
  field: string;
  type: string;
  axis?: { title: string };
  legend?: { title: string | null };
}

interface VegaEncoding {
  [key: string]: EncodingChannel;
}

interface VegaScale {
  name: string;
  type: string;
  domain: {
    data: string;
    field: string;
    filter?: string;
  };
  range: string;
  padding?: number;
  nice?: boolean;
  zero?: boolean;
}

/**
 * Builds encoding configuration for Vega or Vega-Lite specifications.
 *
 * @param {any} dimensions - The dimensions of the data.
 * @param {AxisFormats} formats - The formatting information for axes.
 * @param {boolean} isVega - Whether to build for Vega (true) or Vega-Lite (false).
 * @returns {VegaEncoding | VegaScale[]} The encoding configuration.
 */
export const buildEncoding = (
  dimensions: any,
  formats: any,
  isVega: boolean = false
): VegaEncoding | VegaScale[] => {
  const { xAxisFormat, xAxisLabel, yAxisFormat, yAxisLabel, zAxisFormat } = formats;

  if (isVega) {
    return buildVegaScales(dimensions, formats);
  }

  return buildVegaLiteEncoding(dimensions, formats);
};

/**
 * Builds encoding configuration for Vega-Lite specifications.
 *
 * @param {any} dimensions - The dimensions of the data.
 * @param {any} formats - The formatting information for axes.
 * @returns {VegaEncoding} The Vega-Lite encoding configuration.
 */
const buildVegaLiteEncoding = (dimensions: any, formats: any): VegaEncoding => {
  const { xAxisFormat, xAxisLabel, yAxisFormat, yAxisLabel, zAxisFormat } = formats;
  const encoding: VegaEncoding = {};

  // Handle x-axis
  encoding.x = buildAxisEncoding('x', dimensions.x, xAxisFormat, xAxisLabel);

  // Handle y-axis
  encoding.y = buildAxisEncoding('y', dimensions.y, yAxisFormat, yAxisLabel);

  // Handle color encoding for multiple y dimensions or series
  if (dimensions.y && dimensions.y.length > 1) {
    encoding.color = buildColorEncoding('series', 'nominal');
  } else if (dimensions.series) {
    encoding.color = buildColorEncoding('series', mapFieldTypeToVegaType(zAxisFormat?.id || ''));
  }

  return encoding;
};

/**
 * Builds scale configurations for Vega specifications.
 *
 * @param {any} dimensions - The dimensions of the data.
 * @param {any} formats - The formatting information for axes.
 * @returns {VegaScale[]} The Vega scale configurations.
 */
const buildVegaScales = (dimensions: any, formats: any): VegaScale[] => {
  const scales: VegaScale[] = [
    {
      name: 'xscale',
      type: 'band',
      domain: { data: 'source', field: 'x', filter: 'datum.split == parent.split' },
      range: 'width',
      padding: 0.2,
    },
    {
      name: 'yscale',
      type: 'linear',
      domain: { data: 'source', field: 'y', filter: 'datum.split == parent.split' },
      range: 'height',
      nice: true,
      zero: true,
    },
  ];

  if (dimensions.z) {
    scales.push({
      name: 'size',
      type: 'linear',
      domain: { data: 'source', field: 'z' },
    });
  }

  return scales;
};

/**
 * Builds encoding for an axis.
 *
 * @param {string} field - The field name ('x' or 'y').
 * @param {any[]} dimension - The dimension data.
 * @param {AxisFormat} axisFormat - The axis format information.
 * @param {string} axisLabel - The axis label.
 * @returns {EncodingChannel} The axis encoding configuration.
 */
const buildAxisEncoding = (
  field: string,
  dimension: any[] | undefined,
  axisFormat: AxisFormat,
  axisLabel: string
): EncodingChannel => {
  return {
    field,
    type: dimension ? mapFieldTypeToVegaType(axisFormat.id) : 'ordinal',
    axis: { title: axisLabel },
  };
};

/**
 * Builds encoding for color.
 *
 * @param {string} field - The field name for color encoding.
 * @param {string} type - The data type for color encoding.
 * @returns {EncodingChannel} The color encoding configuration.
 */
const buildColorEncoding = (field: string, type: string): EncodingChannel => {
  return {
    field,
    type,
    legend: { title: null },
  };
};
