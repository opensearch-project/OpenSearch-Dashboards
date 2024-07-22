/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mapFieldTypeToVegaType } from '../utils/helpers';
import { AxisFormat, AxisFormats } from '../utils/types';

interface BaseEncodingChannel {
  field?: string;
  type?: string;
  legend?: { title: string | null } | null;
}

export interface AxisEncodingChannel extends BaseEncodingChannel {
  axis?: { title: string };
}

export type ColorEncodingChannel = BaseEncodingChannel;

export interface TooltipEncodingChannel extends BaseEncodingChannel {
  title?: string;
}
export interface VegaEncoding {
  x?: AxisEncodingChannel;
  y?: AxisEncodingChannel;
  color?: ColorEncodingChannel;
  tooltip?: TooltipEncodingChannel | TooltipEncodingChannel[];
  [key: string]:
    | BaseEncodingChannel
    | BaseEncodingChannel[]
    | TooltipEncodingChannel
    | TooltipEncodingChannel[]
    | undefined;
}

export interface VegaScale {
  name: string;
  type: string;
  domain: {
    data: string;
    field: string;
    filter?: string;
  };
  range?: string;
  padding?: number;
  nice?: boolean;
  zero?: boolean;
}

/**
 * Builds encoding configuration for Vega-Lite specifications.
 *
 * @param {any} dimensions - The dimensions of the data.
 * @param {AxisFormats} formats - The formatting information for axes.
 * @returns {VegaEncoding} The Vega-Lite encoding configuration.
 */
export const buildVegaLiteEncoding = (dimensions: any, formats: AxisFormats): VegaEncoding => {
  const { xAxisFormat, xAxisLabel, yAxisFormat, yAxisLabel } = formats;
  const encoding: VegaEncoding = {};

  // Handle x-axis
  encoding.x = buildAxisEncoding('x', dimensions.x, xAxisFormat, xAxisLabel);

  // Handle y-axis
  encoding.y = buildAxisEncoding('y', dimensions.y, yAxisFormat, yAxisLabel);

  // Handle color encoding for multiple y dimensions or series
  if (dimensions.y) {
    encoding.color = buildColorEncoding('series', 'nominal');
  }

  return encoding;
};

/**
 * Builds encoding for an axis.
 *
 * @param {string} field - The field name ('x' or 'y').
 * @param {any[]} dimension - The dimension data.
 * @param {AxisFormat} axisFormat - The axis format information.
 * @param {string} axisLabel - The axis label.
 * @returns {AxisEncodingChannel} The axis encoding configuration.
 */
const buildAxisEncoding = (
  field: string,
  dimension: any[] | undefined,
  axisFormat?: AxisFormat,
  axisLabel?: string
): AxisEncodingChannel => {
  return {
    field,
    type: dimension ? mapFieldTypeToVegaType(axisFormat?.id) : 'ordinal',
    axis: { title: axisLabel ? axisLabel : '' },
  };
};

/**
 * Builds encoding for color.
 *
 * @param {string} field - The field name for color encoding.
 * @param {string} type - The data type for color encoding.
 * @returns {ColorEncodingChannel} The color encoding configuration.
 */
const buildColorEncoding = (field: string, type: string): ColorEncodingChannel => {
  return {
    field,
    type,
    legend: { title: null },
  };
};
