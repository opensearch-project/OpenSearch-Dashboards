/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildEncoding } from './components/encoding';
import { buildMark } from './components/mark';
import { buildLegend } from './components/legend';
import { VegaSpec, AxisFormats } from './utils/types';
import { StyleState } from '../../application/utils/state_management';

/**
 * Builds a Vega specification based on the provided data, visual configuration, and style.
 *
 * @param {object} data - The data object containing series and axis information.
 * @param {any} visConfig - The visual configuration settings.
 * @param {StyleState} style - The style configuration for the visualization.
 * @returns {VegaSpec} The complete Vega specification.
 */
export const buildVegaSpecViaVega = (data: any, visConfig: any, style: StyleState): VegaSpec => {
  const { dimensions, addLegend, legendPosition } = visConfig;
  const { type } = style;
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
        domain: { data: 'splits', field: 'split' },
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
    marks: [
      {
        type: 'group',
        from: { data: 'splits' },
        encode: {
          enter: {
            width: { signal: 'chartWidth' },
            height: { signal: 'height' },
            stroke: { value: '#ccc' },
            strokeWidth: { value: 1 },
          },
        },
        signals: [{ name: 'width', update: 'chartWidth' }],
        scales: buildEncoding(dimensions, formats, true),
        axes: [
          {
            orient: 'bottom',
            scale: 'xscale',
            zindex: 1,
            labelAngle: -90,
            labelAlign: 'right',
            labelBaseline: 'middle',
          },
          { orient: 'left', scale: 'yscale', zindex: 1 },
        ],
        title: {
          text: { signal: 'parent.split' },
          anchor: 'middle',
          offset: 10,
          limit: { signal: 'chartWidth' },
          wrap: true,
          align: 'center',
        },
        marks: buildMark(type, true),
      },
    ],
  };

  // Add legend if specified
  if (addLegend) {
    spec.legends = [buildLegend(legendPosition, true)];
  }

  return spec;
};
