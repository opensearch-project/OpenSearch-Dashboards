/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreloadedState } from '@reduxjs/toolkit';
import { WizardServices } from '../../..';
import { getPreloadedState as getPreloadedStyleState } from './style_slice';
import { getPreloadedState as getPreloadedVisualizationState } from './visualization_slice';
import { getPreloadedState as getPreloadedMetadataState } from './metadata_slice';
import { RootState } from './store';

export const getPreloadedState = async (
  services: WizardServices
): Promise<PreloadedState<RootState>> => {
  const styleState = await getPreloadedStyleState(services);
  const visualizationState = await getPreloadedVisualizationState(services);
  const metadataState = await getPreloadedMetadataState(services);

  return {
    style: styleState,
    visualization: visualizationState,
    metadata: metadataState,
  };
};
