/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisFormats, VegaLiteSpec } from '../utils/types';

/**
 * Builds tooltip configuration for a dynamic Vega specification using OpenSearch data.
 *
 * @param {VegaLiteSpec} baseSpec - The base Vega Lite specification to modify.
 * @param {any} dimensions - The dimensions of the data.
 * @param {AxisFormats} formats - The formatting information for axes.
 * @returns {void} - This function modifies the baseSpec object in place.
 */
export const buildTooltip = (
  baseSpec: VegaLiteSpec,
  dimensions: any,
  formats: AxisFormats
): void => {
  const { xAxisLabel, yAxisLabel } = formats;

  if (!baseSpec.encoding) {
    baseSpec.encoding = {};
  }

  // Configure tooltip based on the presence of yAxisLabel
  if (!yAxisLabel) {
    // If yAxisLabel is not provided, combine series and y value for tooltip
    baseSpec.transform = [
      {
        calculate: "datum.series + ': ' + datum.y",
        as: 'metrics',
      },
    ];

    baseSpec.encoding.tooltip = [
      { field: 'x', type: 'nominal', title: xAxisLabel || '_all' },
      { field: 'metrics', type: 'nominal' },
    ];
  } else {
    // If yAxisLabel is provided, use separate fields for x and y in tooltip
    baseSpec.encoding.tooltip = [
      { field: 'x', type: 'nominal', title: xAxisLabel || '_all' },
      { field: 'y', type: 'nominal', title: yAxisLabel },
    ];
  }

  // Add z dimension to tooltip if it exists
  if (dimensions.z && dimensions.z.length > 0) {
    baseSpec.encoding.tooltip.push({
      field: 'z',
      type: 'quantitative',
      title: dimensions.z[0].label,
    });
  }

  // Enable tooltip for the mark
  baseSpec.mark = {
    ...baseSpec.mark,
    tooltip: true,
  };
};
