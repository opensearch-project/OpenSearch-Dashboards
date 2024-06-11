/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataExplorerServices } from '../../types';
import { getPreloadedState } from './preload';
import { RootState } from './store';

export const loadReduxState = async (services: DataExplorerServices) => {
  try {
    const serializedState = services.osdUrlStateStorage.get<RootState>('_a');
    if (serializedState !== null) return serializedState;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return await getPreloadedState(services);
};

export const persistReduxState = (root: RootState, services: DataExplorerServices) => {
  try {
    services.osdUrlStateStorage.set<RootState>('_a', root, {
      replace: true,
    });
  } catch (err) {
    return;
  }
};
