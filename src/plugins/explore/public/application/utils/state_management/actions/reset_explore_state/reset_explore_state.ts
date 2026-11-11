/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  clearResults,
  setLegacyState,
  setQueryEditorState,
  setQueryState,
  setTabState,
  setUiState,
} from '../../slices';
import { getPreloadedState } from '../../utils/redux_persistence';
import { ExploreServices } from '../../../../../types';
import { executeQueries } from '../query_actions';
import { AppDispatch, RootState } from '../../store';
import { useClearEditors } from '../../../../hooks';
import { detectAndSetOptimalTab } from '../detect_optimal_tab';
import { datasetRequiresExplicitRun } from '../../../requires_explicit_run';
import { refreshAiAvailability } from '../../middleware/ai_availability_middleware';

/**
 * Redux Thunk for resetting the Explore state to its preloaded state.
 * This is useful for resetting the application to a known state, such as when clicking on the "new search" button.
 */
export const resetExploreStateActionCreator =
  (services: ExploreServices, clearEditors: ReturnType<typeof useClearEditors>) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = await getPreloadedState(services);
    // The preloaded state has the AI flags off; keep the current ones until the refresh lands.
    const currentQueryEditor = state.query?.dataset ? getState().queryEditor : undefined;
    const queryEditorState = currentQueryEditor
      ? {
          ...state.queryEditor,
          promptModeIsAvailable: currentQueryEditor.promptModeIsAvailable,
          summaryAgentIsAvailable: currentQueryEditor.summaryAgentIsAvailable,
        }
      : state.queryEditor;

    clearEditors();
    dispatch(setUiState(state.ui));
    dispatch(clearResults());
    dispatch(setTabState(state.tab));
    dispatch(setLegacyState(state.legacy));
    dispatch(setQueryState(state.query));
    dispatch(setQueryEditorState(queryEditorState));
    if (state.query?.dataset) {
      dispatch(refreshAiAvailability());
    }
    await dispatch(detectAndSetOptimalTab({ services }));
    // A dataset type that requires an explicit Run waits for the user.
    if (datasetRequiresExplicitRun(services.data?.query?.queryString, state.query?.dataset)) return;
    await dispatch(executeQueries({ services }));
  };
