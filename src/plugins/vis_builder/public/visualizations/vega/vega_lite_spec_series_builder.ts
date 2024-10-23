/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildVegaLiteEncoding } from './components/encoding';
import { buildMarkForVegaLite, VegaMarkType } from './components/mark/mark';
import { buildTooltip } from './components/tooltip';
import { buildLegend } from './components/legend';
import { StyleState } from '../../application/utils/state_management';
import { VegaLiteSpec, AxisFormats } from './utils/types';
import { mapChartTypeToVegaType } from './utils/helpers';

/**
 * Builds a Vega-Lite specification based on the provided data, visual configuration, and style.
 *
 * @param {any} data - The data configuration, normally including axis formats and transformed data.
 * @param {any} visConfig - The visual configuration including dimensions and display options.
 * @param {StyleState} style - The StyleState defined in style slice.
 * @returns {VegaLiteSpec} The complete Vega-Lite specification.
 */
export const generateVegaLiteSpecForSeries = (
  data: any,
  visConfig: any,
  style: StyleState
): VegaLiteSpec => {
  const { dimensions, addLegend, legendPosition, addTooltip } = visConfig;
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

  // Build the base Vega-Lite specification
  const baseSpec: VegaLiteSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: transformedData },
    mark: buildMarkForVegaLite(vegaType),
    encoding: buildVegaLiteEncoding(dimensions, formats),
  };

  // Handle special case for line charts with dot size
  if (dimensions.z) {
    baseSpec.layer = [
      {
        mark: { type: 'line', point: false },
        encoding: buildVegaLiteEncoding(dimensions, formats),
      },
      {
        mark: { type: 'point', filled: true },
        encoding: {
          ...buildVegaLiteEncoding(dimensions, formats),
          size: {
            field: 'z',
            type: 'quantitative',
            legend: null,
          },
        },
      },
    ];
  }

  // Add legend if specified
  if (addLegend) {
    baseSpec.config = {
      legend: buildLegend(legendPosition),
    };
  }

  // Add tooltip if specified
  if (addTooltip) {
    buildTooltip(baseSpec, dimensions, formats);
  }

  return baseSpec;
};
