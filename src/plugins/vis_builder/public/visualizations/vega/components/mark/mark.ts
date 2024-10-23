/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisFormats } from '../utils/types';
import { buildAxes } from '../axes';

export type VegaMarkType =
  | 'line'
  | 'rect'
  | 'area'
  | 'symbol'
  | 'bar'
  | 'point'
  | 'circle'
  | 'square'
  | 'group';

export interface VegaMark {
  type: VegaMarkType;
  from?: {
    data?: string;
    facet?: {
      name?: string;
      data?: string;
      groupby?: string | string[];
      filter?: string;
    };
  };
  encode?: {
    enter?: Record<string, any>;
    update?: Record<string, any>;
  };
  signals?: Array<{ name: string; update: string }>;
  scales?: any[]; // TODO: create a more specific type for scales
  axes?: any[]; // TODO: create a more specific type for axes
  title?: {
    text: string | { signal: string };
  };
  marks?: VegaMark[];
}

interface BaseVegaLiteMark {
  type: VegaMarkType;
  tooltip?: boolean;
  [key: string]: any;
}

interface LineVegaLiteMark extends BaseVegaLiteMark {
  type: 'line';
  point?: boolean | { filled?: boolean; size?: number };
}

interface AreaVegaLiteMark extends BaseVegaLiteMark {
  type: 'area';
  line?: boolean;
}

interface BarVegaLiteMark extends BaseVegaLiteMark {
  type: 'bar';
  cornerRadius?: number;
}

export type VegaLiteMark = BaseVegaLiteMark | LineVegaLiteMark | AreaVegaLiteMark | BarVegaLiteMark;

/**
 * Builds a mark configuration for Vega-Lite based on the chart type.
 *
 * @param {string} vegaType - The type of Vega mark to build.
 * @returns {VegaLiteMark} The Vega-Lite mark configuration.
 */
export const buildMarkForVegaLite = (vegaType: string): VegaLiteMark => {
  switch (vegaType) {
    case 'line':
      return { type: 'line', point: true };
    case 'area':
      return { type: 'area', line: true, opacity: 1, fillOpacity: 1, baseline: 0 };
    case 'rect':
    case 'bar':
      return { type: 'bar' };
    default:
      // Currently we can only handle line/area/bar.
      // Set default to use line chart.
      return { type: 'line', point: true };
  }
};

/**
 * Builds a mark configuration for Vega useing series data based on the chart type.
 *
 * @param {VegaMarkType} chartType - The type of chart to build the mark for.
 * @param {any} dimensions - The dimensions of the data.
 * @param {AxisFormats} formats - The formatting information for axes.
 * @returns {VegaMark} An array of mark configurations.
 */
export const buildMarkForVega = (
  chartType: VegaMarkType,
  dimensions: any,
  formats: AxisFormats
): VegaMark => {
  const baseMark: VegaMark = {
    type: 'group',
    from: {
      facet: {
        name: 'split_data',
        data: chartType === 'area' ? 'stacked' : 'source',
        groupby: 'split',
      },
    },
    encode: {
      enter: {
        width: { signal: 'chartWidth' },
        height: { signal: 'height' },
      },
    },
    signals: [{ name: 'width', update: 'chartWidth' }],
    scales: [
      buildXScale(chartType, dimensions),
      buildYScale(chartType),
      {
        name: 'color',
        type: 'ordinal',
        domain: { data: 'split_data', field: 'series' },
        range: 'category',
      },
    ],
    axes: buildAxes(dimensions, formats),
    title: {
      text: { signal: 'parent.split' },
    },
    marks: [
      {
        type: 'group',
        from: {
          facet: {
            name: 'series_data',
            data: 'split_data',
            groupby: 'series',
          },
        },
        marks: buildChartTypeMarksForVega(chartType, dimensions),
      },
    ],
  };

  return baseMark;
};

const buildXScale = (chartType: VegaMarkType, dimensions) => {
  // For date-based data, use a time scale regardless of the chart type.
  if (dimensions.x && dimensions.x.format && dimensions.x.format.id === 'date') {
    return {
      name: 'x',
      type: 'time',
      domain: { data: 'split_data', field: 'x' },
      range: 'width',
    };
  }

  switch (chartType) {
    case 'bar':
      return {
        name: 'x',
        type: 'band',
        domain: { data: 'split_data', field: 'x' },
        range: 'width',
        padding: 0.1,
      };
    case 'line':
    case 'area':
    default:
      return {
        name: 'x',
        type: 'point',
        domain: { data: 'split_data', field: 'x' },
        range: 'width',
        padding: 0.5,
      };
  }
};

const buildYScale = (chartType: VegaMarkType) => {
  return {
    name: 'y',
    type: 'linear',
    domain: { data: 'split_data', field: chartType === 'area' ? 'y1' : 'y' },
    range: 'height',
    nice: true,
    zero: true,
  };
};

/**
 * Builds a mark configuration for Vega based on the chart type.
 *
 * @param {VegaMarkType} chartType - The type of chart to build the mark for.
 * @param {any} dimensions - The dimensions of the data.
 * @param {AxisFormats} formats - The formatting information for axes.
 * @returns {VegaMark[]} An array of mark configurations.
 */
const buildChartTypeMarksForVega = (chartType: VegaMarkType, dimensions: any): VegaMark[] => {
  switch (chartType) {
    case 'line':
      return buildMarkForLine(dimensions);
    case 'bar':
      return buildMarkForBar();
    case 'area':
      return buildMarkForArea();
    default:
      return buildMarkForLine(dimensions);
  }
};

/**
 * Builds a mark configuration for a line chart in Vega.
 *
 * @param {any} dimensions - The dimensions of the data.
 * @returns {VegaMark[]} An array of mark configurations for line and point marks.
 */
const buildMarkForLine = (dimensions: any): VegaMark[] => {
  const marks: VegaMark[] = [
    {
      type: 'line',
      from: { data: 'series_data' },
      encode: {
        enter: {
          x: { scale: 'x', field: 'x' },
          y: { scale: 'y', field: 'y' },
          stroke: { scale: 'color', field: 'series' },
          strokeWidth: { value: 2 },
        },
      },
    },
    {
      type: 'symbol',
      from: { data: 'series_data' },
      encode: {
        enter: {
          x: { scale: 'x', field: 'x' },
          y: { scale: 'y', field: 'y' },
          fill: { scale: 'color', field: 'series' },
          size: dimensions.z ? { scale: 'size', field: 'z' } : { value: 50 },
        },
      },
    },
  ];
  return marks;
};

/**
 * Builds a mark configuration for a histogram in Vega.
 *
 * @returns {VegaMark[]} An array with a single mark configuration for rect marks.
 */
const buildMarkForBar = (): VegaMark[] => {
  return [
    {
      type: 'rect',
      from: { data: 'series_data' },
      encode: {
        enter: {
          x: { scale: 'x', field: 'x' },
          width: { scale: 'x', band: 1, offset: -1 },
          y: { scale: 'y', field: 'y' },
          y2: { scale: 'y', value: 0 },
          fill: { scale: 'color', field: 'series' },
        },
      },
    },
  ];
};

/**
 * Builds a mark configuration for an area chart in Vega.
 *
 * @returns {VegaMark[]} An array with a single mark configuration for grouped area marks.
 */
const buildMarkForArea = (): VegaMark[] => {
  return [
    {
      type: 'area',
      from: { data: 'series_data' },
      encode: {
        enter: {
          x: { scale: 'x', field: 'x' },
          y: { scale: 'y', field: 'y0' },
          y2: { scale: 'y', field: 'y1' },
          fill: { scale: 'color', field: 'series' },
          fillOpacity: { value: 1 },
          stroke: { scale: 'color', field: 'series' },
          strokeWidth: { value: 1 },
        },
      },
    },
  ];
};
