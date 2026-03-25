/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { VisualizationBuilder } from '../../../components/visualizations/visualization_builder';

let visualizationBuilderForEditor: VisualizationBuilder;

export const useVisualizationBuilder = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();

  if (!visualizationBuilderForEditor) {
    visualizationBuilderForEditor = new VisualizationBuilder({
      getUrlStateStorage: () => services.osdUrlStateStorage,
    });
  }

  return { visualizationBuilderForEditor };
};
