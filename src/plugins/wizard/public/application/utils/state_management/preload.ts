/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreloadedState } from '@reduxjs/toolkit';
import { WizardServices } from '../../..';
import { getPreloadedState as getPreloadedDatasourceState } from './datasource_slice';
import { getPreloadedState as getPreloadedVisualizationState } from './visualization_slice';
import { RootState } from './store';

export const getPreloadedState = async (
  services: WizardServices
): Promise<PreloadedState<RootState>> => {
  const dataSourceState = await getPreloadedDatasourceState(services);
  const visualizationState = await getPreloadedVisualizationState(services);

  return {
    dataSource: dataSourceState,
    visualization: visualizationState,
  };
};
