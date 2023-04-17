/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisBuilderServices } from '../../../types';
import { getPreloadedState } from './preload';
import { RootState } from './store';

export const loadReduxState = async (services: VisBuilderServices) => {
  try {
    const serializedState = services.osdUrlStateStorage.get<RootState>('_a');
    if (serializedState !== null) return serializedState;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return await getPreloadedState(services);
};

export const persistReduxState = (
  { style, visualization, metadata, ui }: RootState,
  services: VisBuilderServices
) => {
  try {
    services.osdUrlStateStorage.set<RootState>(
      '_a',
      { style, visualization, metadata, ui },
      {
        replace: true,
      }
    );
  } catch (err) {
    return;
  }
};
