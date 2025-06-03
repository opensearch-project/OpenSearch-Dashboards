/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StyleState } from '../../application/utils/state_management';
import { flattenDataHandler } from './utils/helpers';
import { generateVegaLiteSpecForSeries } from './vega_lite_spec_series_builder';
import { generateVegaSpecForSeries } from './vega_spec_series_builder';
import { generateVegaSpecForSlices } from './vega_spec_slices_builder';
import { VegaLiteSpec, VegaSpec } from './utils/types';

/**
 * Builds a Vega or Vega-Lite specification based on the provided context, visual configuration, and style.
 *
 * @param {any} context - The context data for the visualization.
 * @param {any} visConfig - The visual configuration settings.
 * @param {StyleState} style - The style configuration for the visualization.
 * @returns {VegaLiteSpec | VegaSpec} The complete Vega or Vega-Lite specification.
 */
export const createVegaSpec = (
  context: any,
  visConfig: any,
  style: StyleState
): VegaLiteSpec | VegaSpec => {
  const { dimensions } = visConfig;

  // Transform the data using the flattenDataHandler
  const handler = style.type !== 'pie' ? 'series' : 'slices';
  const transformedData = flattenDataHandler(context, dimensions, handler);

  return handler === 'series'
    ? createVegaSpecForSeriesData(dimensions, transformedData, visConfig, style)
    : createVegaSpecForSlicesData(dimensions, transformedData, visConfig, style);
};

const createVegaSpecForSeriesData = (dimensions, transformedData, visConfig, style) => {
  // Determine whether to use Vega or Vega-Lite based on the presence of split dimensions
  // TODO: Summarize the cases to use Vega. Change this to a better determine function.
  if (dimensions.splitRow || dimensions.splitColumn) {
    // Use Vega for more complex, split visualizations
    return generateVegaSpecForSeries(transformedData, visConfig, style);
  } else {
    // Use Vega-Lite for simpler visualizations
    return generateVegaLiteSpecForSeries(transformedData, visConfig, style);
  }
};

const createVegaSpecForSlicesData = (dimensions, transformedData, visConfig, style) => {
  return generateVegaSpecForSlices(transformedData, visConfig, style);
};
