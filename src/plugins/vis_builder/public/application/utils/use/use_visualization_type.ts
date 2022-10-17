/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { VisualizationType } from '../../../services/type_service/visualization_type';
import { WizardServices } from '../../../types';
import { useTypedSelector } from '../state_management';

export const useVisualizationType = (): VisualizationType => {
  const { activeVisualization } = useTypedSelector((state) => state.visualization);
  const {
    services: { types },
  } = useOpenSearchDashboards<WizardServices>();

  const visualizationType = types.get(activeVisualization?.name ?? '');

  if (!visualizationType) {
    throw new Error(`Invalid visualization type ${activeVisualization}`);
  }

  return visualizationType;
};
