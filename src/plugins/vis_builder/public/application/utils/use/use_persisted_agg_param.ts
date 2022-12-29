/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreateAggConfigParams } from '../../../../../data/common';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { VisBuilderServices } from '../../../types';
import { useTypedSelector } from '../state_management';

export const usePersistedAggParams = (
  oldVisType: string,
  newVisType: string
): CreateAggConfigParams[] => {
  const {
    services: { types },
  } = useOpenSearchDashboards<VisBuilderServices>();

  const { activeVisualization } = useTypedSelector((state) => state.visualization);
  const oldAggParams = activeVisualization?.aggConfigParams;

  const oldVisualizationType = types.get(oldVisType)?.ui.containerConfig.data.schemas.all;
  const newVisualizationType = types.get(newVisType)?.ui.containerConfig.data.schemas.all;

  return [];
};
