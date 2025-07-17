/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  setLegacyState,
  setQueryEditorState,
  setQueryState,
  setResultsState,
  setTabState,
  setUiState,
} from '../../slices';
import { getPreloadedState } from '../../utils/redux_persistence';
import { ExploreServices } from '../../../../../types';
import { executeQueries } from '../query_actions';
import { AppDispatch } from '../../store';
import { detectAndSetOptimalTab } from '../detect_optimal_tab';

/**
 * Redux Thunk for resetting the Explore state to its preloaded state.
 * This is useful for resetting the application to a known state, such as when clicking on the "new search" button.
 */
export const resetExploreStateActionCreator = (services: ExploreServices) => async (
  dispatch: AppDispatch
) => {
  const state = await getPreloadedState(services);

  dispatch(setUiState(state.ui));
  dispatch(setResultsState(state.results));
  dispatch(setTabState(state.tab));
  dispatch(setLegacyState(state.legacy));
  dispatch(setQueryState(state.query));
  dispatch(setQueryEditorState(state.queryEditor));
  await dispatch(executeQueries({ services }));
  dispatch(detectAndSetOptimalTab({ services }));
};
