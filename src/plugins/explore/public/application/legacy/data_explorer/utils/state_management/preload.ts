/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreloadedState } from '@reduxjs/toolkit';
import { getPreloadedState as getPreloadedMetadataState } from './metadata_slice';
import { RootState } from './store';
import { DataExplorerServices } from '../../types';
import { DefaultViewState } from '../../../../../../../data_explorer/public';
import { LOGS_VIEW_ID } from '../../../../../../common';

export const getPreloadedState = async (
  services: DataExplorerServices,
  defaults: DefaultViewState | (() => DefaultViewState) | (() => Promise<DefaultViewState>)
): Promise<PreloadedState<RootState>> => {
  let rootState: RootState = {
    metadata: await getPreloadedMetadataState(services),
  };

  // initialize the default state for each view
  try {
    // defaults can be a function or an object
    const preloadedState = typeof defaults === 'function' ? await defaults() : defaults;
    // TODO remove coupling of state id to view (flavor) id and use one global state
    rootState[LOGS_VIEW_ID] = preloadedState.state;

    // if the view wants to override the root state, we do that here
    if (preloadedState.root) {
      rootState = {
        ...rootState,
        ...preloadedState.root,
      };
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Error initializing view: ${e}`);
  }

  return rootState;
};
