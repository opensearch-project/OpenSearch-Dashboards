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
  let rootState: RootState = {
    metadata: await getPreloadedMetadataState(services),
  };

  // initialize the default state for each view
  const views = services.viewRegistry.all();
  const promises = views.map(async (view) => {
    if (!view.ui) {
      return;
    }

    const { defaults } = view.ui;

    try {
      // defaults can be a function or an object
      const preloadedState = typeof defaults === 'function' ? await defaults() : defaults;
      rootState[view.id] = preloadedState.state;

      // if the view wants to override the root state, we do that here
      if (preloadedState.root) {
        rootState = {
          ...rootState,
          ...preloadedState.root,
        };
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error initializing view ${view.id}: ${e}`);
    }
  });
  await Promise.all(promises);

  return rootState;
};
