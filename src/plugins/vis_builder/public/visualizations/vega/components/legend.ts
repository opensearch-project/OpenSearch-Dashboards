/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Types for legend positions and legend configurations
type LegendPosition = 'top' | 'bottom' | 'left' | 'right';

interface VegaLegendConfig {
  fill?: string;
  orient: LegendPosition;
  [key: string]: any; // For any additional properties
}

interface VegaLiteLegendConfig {
  orient: LegendPosition;
  [key: string]: any; // For any additional properties
}

/**
 * Builds a legend configuration for Vega or Vega-Lite specifications.
 *
 * @param {LegendPosition} legendPosition - The position of the legend ('top', 'bottom', 'left', 'right').
 * @param {boolean} isVega - Whether to build for Vega (true) or Vega-Lite (false).
 * @returns {VegaLegendConfig | VegaLiteLegendConfig} The legend configuration object.
 */
export const buildLegend = (
  legendPosition: LegendPosition,
  isVega: boolean = false
): VegaLegendConfig | VegaLiteLegendConfig => {
  if (isVega) {
    return buildVegaLegend(legendPosition);
  }
  return buildVegaLiteLegend(legendPosition);
};

/**
 * Builds a legend configuration specifically for Vega specifications.
 *
 * @param {LegendPosition} legendPosition - The position of the legend.
 * @returns {VegaLegendConfig} The Vega legend configuration object.
 */
const buildVegaLegend = (legendPosition: LegendPosition): VegaLegendConfig => {
  return {
    fill: 'color',
    orient: legendPosition,
  };
};

/**
 * Builds a legend configuration specifically for Vega-Lite specifications.
 *
 * @param {LegendPosition} legendPosition - The position of the legend.
 * @returns {VegaLiteLegendConfig} The Vega-Lite legend configuration object.
 */
const buildVegaLiteLegend = (legendPosition: LegendPosition): VegaLiteLegendConfig => {
  return {
    orient: legendPosition,
  };
};
