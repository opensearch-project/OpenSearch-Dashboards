/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StyleState } from '../../application/utils/state_management';
import { flattenDataHandler } from './utils/helpers';
import { generateVegaLiteSpec } from './vega_lite_spec_builder';
import { generateVegaSpec } from './vega_spec_builder';
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
  const transformedData = flattenDataHandler(context, dimensions, 'series');

  // Determine whether to use Vega or Vega-Lite based on the presence of split dimensions
  if (dimensions.splitRow || dimensions.splitColumn) {
    // Use Vega for more complex, split visualizations
    return generateVegaSpec(transformedData, visConfig, style);
  } else {
    // Use Vega-Lite for simpler visualizations
    return generateVegaLiteSpec(transformedData, visConfig, style);
  }
};
