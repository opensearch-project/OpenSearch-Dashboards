/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VegaSpec } from './utils/types';
import { buildLegend } from './components/legend';
import { StyleState } from '../../application/utils/state_management';
import { buildSlicesMarkForVega } from './components/mark/mark_slices';

/**
 * Generates a Vega specification for a sliced chart (pie/donut chart).
 *
 * @param {any} data - The data object containing slices and levels information.
 * @param {any} visConfig - The visualization configuration object.
 * @param {StyleState} style - The style state object.
 * @returns {VegaSpec} A Vega specification object for the sliced chart.
 */
export const generateVegaSpecForSlices = (
  data: any,
  visConfig: any,
  style: StyleState
): VegaSpec => {
  const { dimensions, addLegend, addTooltip, legendPosition, isDonut } = visConfig;
  const { slices, levels } = data;
  const hasSplit = dimensions.splitRow || dimensions.splitColumn;

  const spec: VegaSpec = {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    padding: 5,

    signals: [
      { name: 'splitCount', update: hasSplit ? `length(data('splits'))` : '1' },
      { name: 'levelCount', update: levels.length.toString() },
      { name: 'chartWidth', update: hasSplit ? 'width / splitCount - 10' : 'width' },
      { name: 'chartHeight', update: 'height' },
      { name: 'radius', update: 'min(chartWidth, chartHeight) / 2' },
      {
        name: 'innerRadiusRatio',
        update: isDonut ? 'max(0.1, 0.4 - (levelCount - 1) * 0.05)' : '0',
      },
      { name: 'innerRadius', update: 'radius * innerRadiusRatio' },
      { name: 'thickness', update: '(radius - innerRadius) / levelCount' },
    ],

    data: [
      {
        name: 'table',
        values: slices,
        transform: [{ type: 'filter', expr: 'datum.value != null' }],
      },
      {
        name: 'splits',
        source: 'table',
        transform: [
          {
            type: 'aggregate',
            groupby: hasSplit ? ['split'] : [],
          },
        ],
      },
    ],

    scales: [
      {
        name: 'color',
        type: 'ordinal',
        domain: { data: 'table', fields: levels },
        range: { scheme: 'category20' },
      },
    ],

    layout: hasSplit
      ? {
          columns: { signal: 'splitCount' },
          padding: { row: 40, column: 20 },
        }
      : null,

    marks: [buildSlicesMarkForVega(levels, hasSplit, addTooltip)],
  };

  // Add legend if specified
  if (addLegend) {
    spec.legends = [buildLegend(legendPosition, true)];
  }

  return spec;
};
