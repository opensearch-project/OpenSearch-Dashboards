/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationBuilder } from '../../../components/visualizations/visualization_builder';
import { getServices } from '../../../services/services';

let visualizationBuilderForEditor: VisualizationBuilder;

export const useVisualizationBuilder = () => {
  if (!visualizationBuilderForEditor) {
    visualizationBuilderForEditor = new VisualizationBuilder({
      getUrlStateStorage: () => getServices().osdUrlStateStorage,
    });
  }

  return { visualizationBuilderForEditor };
};
