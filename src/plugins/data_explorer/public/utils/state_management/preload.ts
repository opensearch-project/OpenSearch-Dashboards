/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreloadedState } from '@reduxjs/toolkit';
import { getPreloadedState as getPreloadedMetadataState } from './metadata_slice';
import { RootState } from './store';
import { DataExplorerServices } from '../../types';

export const getPreloadedState = async (
  services: DataExplorerServices
): Promise<PreloadedState<RootState>> => {
  const rootState: RootState = {
    metadata: await getPreloadedMetadataState(services),
  };

  // initialize the default state for each view
  const views = services.viewRegistry.all();
  views.forEach(async (view) => {
    if (!view.ui) {
      return;
    }

    const { defaults } = view.ui;

    // defaults can be a function or an object
    if (typeof defaults === 'function') {
      rootState[view.id] = await defaults();
    } else {
      rootState[view.id] = defaults;
    }
  });

  return rootState;
};
