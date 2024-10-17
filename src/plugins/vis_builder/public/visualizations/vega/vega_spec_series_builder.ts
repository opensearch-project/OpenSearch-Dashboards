/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildMarkForVega, VegaMarkType } from './components/mark/mark';
import { buildLegend } from './components/legend';
import { VegaSpec, AxisFormats } from './utils/types';
import { StyleState } from '../../application/utils/state_management';
import { mapChartTypeToVegaType } from './utils/helpers';

/**
 * Builds a Vega specification based on the provided data, visual configuration, and style.
 *
 * @param {object} data - The data object containing series and axis information.
 * @param {any} visConfig - The visual configuration settings.
 * @param {StyleState} style - The style configuration for the visualization.
 * @returns {VegaSpec} The complete Vega specification.
 */
export const generateVegaSpecForSeries = (
  data: any,
  visConfig: any,
  style: StyleState
): VegaSpec => {
  const { dimensions, addLegend, legendPosition } = visConfig;
  const { type } = style;
  const vegaType = mapChartTypeToVegaType(type) as VegaMarkType;
  const {
    xAxisFormat,
    xAxisLabel,
    yAxisFormat,
    yAxisLabel,
    zAxisFormat,
    series: transformedData,
  } = data;

  const formats: AxisFormats = {
    xAxisFormat,
    xAxisLabel,
    yAxisFormat,
    yAxisLabel,
    zAxisFormat,
  };

  const spec: VegaSpec = {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    padding: 5,
    data: [
      {
        name: 'source',
        values: transformedData,
      },
      {
        name: 'splits',
        source: 'source',
        transform: [
          {
            type: 'aggregate',
            groupby: ['split'],
          },
        ],
      },
    ],
    signals: [
      { name: 'splitCount', update: 'length(data("splits"))' },
      { name: 'chartWidth', update: 'width / splitCount - 10' },
    ],
    scales: [
      {
        name: 'splitScale',
        type: 'band',
        domain: { data: type === 'area' ? 'stacked' : 'splits', field: 'split' },
        range: 'width',
        padding: 0.1,
      },
      {
        name: 'color',
        type: 'ordinal',
        domain: { data: 'source', field: 'series' },
        range: 'category',
      },
    ],
    layout: {
      columns: { signal: 'splitCount' },
      padding: { row: 40, column: 20 },
    },
    marks: [buildMarkForVega(vegaType, dimensions, formats)],
  };

  // Special case 1: Handle dot aggregation for line chart
  if (dimensions.z) {
    spec.scales!.push({
      name: 'size',
      type: 'sqrt',
      domain: { data: 'source', field: 'z' },
      range: [{ signal: '2' }, { signal: 'width * height / 500' }],
    });
  }

  // Special case 2: Add stack transform for area charts
  if (type === 'area') {
    spec.data.push({
      name: 'stacked',
      source: 'source',
      transform: [
        {
          type: 'stack',
          groupby: ['split', 'x'],
          sort: { field: 'series' },
          field: 'y',
        },
      ],
    });
  }

  // Add legend if specified
  if (addLegend) {
    spec.legends = [buildLegend(legendPosition, true)];
  }

  return spec;
};
