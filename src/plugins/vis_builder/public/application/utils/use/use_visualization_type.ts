/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { VisualizationType } from '../../../services/type_service/visualization_type';
import { VisBuilderViewServices } from '../../../types';
import { useVisBuilderContext } from '../../view_components/context';

export const useVisualizationType = (): VisualizationType => {
  const { rootState } = useVisBuilderContext();
  const { activeVisualization } = rootState.visualization;
  const {
    services: { types },
  } = useOpenSearchDashboards<VisBuilderViewServices>();

  const visualizationType = types.get(activeVisualization?.name ?? '');

  if (!visualizationType) {
    throw new Error(`Invalid visualization type ${activeVisualization}`);
  }

  return visualizationType;
};
