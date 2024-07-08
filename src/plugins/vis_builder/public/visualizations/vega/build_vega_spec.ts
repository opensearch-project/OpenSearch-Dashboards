/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationState, StyleState } from '../../application/utils/state_management';
import { flattenDataHandler } from './utils/helpers';
import { buildVegaSpecViaVegaLite } from './build_spec_vega_lite';
import { buildVegaSpecViaVega } from './build_spec_vega';

/**
 * Builds a Vega or Vega-Lite specification based on the provided context, visual configuration, and style.
 *
 * @param {any} context - The context data for the visualization.
 * @param {any} visConfig - The visual configuration settings.
 * @param {VisualizationState} visualization - The visualization object (not used in this function, consider removing if unnecessary).
 * @param {StyleState} style - The style configuration for the visualization.
 * @returns {any} The complete Vega or Vega-Lite specification.
 */
export const buildVegaSpec = (
  context: any,
  visConfig: VisConfig,
  visualization: any,
  style: Style
): any => {
  const { dimensions } = visConfig;

  // Transform the data using the flattenDataHandler
  const transformedData = flattenDataHandler(context, dimensions, 'series');

  // Determine whether to use Vega or Vega-Lite based on the presence of split dimensions
  if (dimensions.splitRow || dimensions.splitColumn) {
    // Use Vega for more complex, split visualizations
    return buildVegaSpecViaVega(transformedData, visConfig, style);
  } else {
    // Use Vega-Lite for simpler visualizations
    return buildVegaSpecViaVegaLite(transformedData, visConfig, style);
  }
};
