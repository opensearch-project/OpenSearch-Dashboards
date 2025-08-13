/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setLegacyState } from '../../slices';
import { getPreloadedLegacyState } from '../../utils/redux_persistence';
import { ExploreServices } from '../../../../../types';
import { AppDispatch } from '../../store';

/**
 * Action creator for resetting the Legacy state to its preloaded state.
 */
export const resetLegacyStateActionCreator = (services: ExploreServices) => async (
  dispatch: AppDispatch
) => {
  const state = await getPreloadedLegacyState(services);

  dispatch(setLegacyState(state));
};
