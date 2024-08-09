/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getVisualizationInstance } from './get_visualization_instance';
import { setStateToOsdUrl } from '../../../../opensearch_dashboards_utils/public';
import { VisualizeServices } from '../types';

export const constructVisBuilderPath = async (
  item: { id: string | Record<string, unknown> | undefined },
  visualizeServices: VisualizeServices
) => {
  const { savedVis } = await getVisualizationInstance(visualizeServices, item.id);

  const indexPattern = savedVis.searchSourceFields?.index;
  const name = savedVis.visState.type;
  const legend = savedVis.visState.params.addLegend;
  const tooltip = savedVis.visState.params.addTooltip;
  const config = savedVis.visState.aggs;
  const position = savedVis.visState.params.legendPosition;
  const type = savedVis.visState.type;
  const uiState = savedVis.uiStateJSON;
  const filter = savedVis.searchSourceFields?.filter;
  const query = savedVis.searchSourceFields?.query;
  const metric = savedVis.visState.params.metric;

  const _q = {
    filters: filter,
    query,
  };

  const _a = {
    metadata: {
      editor: {
        errors: {},
        state: 'clean',
      },
      isMigrated: true,
    },
    style: {
      addLegend: legend,
      addTooltip: tooltip,
      legendPosition: position,
      type,
      metric,
    },
    ui: { uiState },
    visualization: {
      activeVisualization: {
        aggConfigParams: config,
        name,
      },
      indexPattern,
      searchField: '',
    },
  };

  // Construct the path for VisBuilder and set the states to URL
  let visBuilderPath = '/app/vis-builder#/';
  visBuilderPath = setStateToOsdUrl('_q', _q, { useHash: false }, visBuilderPath);
  visBuilderPath = setStateToOsdUrl('_a', _a, { useHash: false }, visBuilderPath);

  return visBuilderPath;
};
