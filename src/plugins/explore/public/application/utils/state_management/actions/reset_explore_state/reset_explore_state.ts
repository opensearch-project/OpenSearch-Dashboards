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
import { beginTransaction, finishTransaction } from '../transaction_actions';
import { executeQueries } from '../query_actions';
import { AppDispatch } from '../../store';

/**
 * Redux Thunk for resetting the Explore state to its preloaded state.
 * This is useful for resetting the application to a known state, such as when clicking on the "new search" button.
 */
export const resetExploreStateActionCreator = (services: ExploreServices) => async (
  dispatch: AppDispatch
) => {
  const state = await getPreloadedState(services);

  dispatch(beginTransaction());
  dispatch(setUiState(state.ui));
  dispatch(setResultsState(state.results));
  dispatch(setTabState(state.tab));
  dispatch(setLegacyState(state.legacy));
  dispatch(setQueryState(state.query));
  dispatch(setQueryEditorState(state.queryEditor));
  dispatch(executeQueries({ services }));
  dispatch(finishTransaction());
};
