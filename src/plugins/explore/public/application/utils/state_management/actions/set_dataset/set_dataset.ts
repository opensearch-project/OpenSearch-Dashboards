/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../../../../types';
import { AppDispatch, RootState } from '../../store';
import {
  clearResults,
  setDataset,
  setEditorMode,
  setPromptModeIsAvailable,
  setQueryWithHistory,
} from '../../slices';
import { executeQueries } from '../query_actions';
import { getPromptModeIsAvailable } from '../../../get_prompt_mode_is_available';
import { EditorMode } from '../../types';
import { useClearEditors } from '../../../../hooks';

export const setDatasetActionCreator = (
  services: ExploreServices,
  clearEditors: ReturnType<typeof useClearEditors>
) => async (dispatch: AppDispatch, getState: () => RootState) => {
  const queryStringState = services.data.query.queryString.getQuery();
  const {
    queryEditor: { editorMode, promptModeIsAvailable },
    query: { dataset },
  } = getState();

  const newPromptModeIsAvailable = await getPromptModeIsAvailable(services);

  // Get the current dataset from the state
  let dataView;
  if (dataset && dataset.id) {
    try {
      // Ensure the dataView is loaded before proceeding
      await services.data.dataViews.ensureDefaultDataView();

      // Fetch the full DataView object
      dataView = await services.data.dataViews.get(dataset.id, dataset.type !== 'INDEX_PATTERN');
    } catch (error) {
      // Handle error if dataset cannot be found
      // We'll continue without the dataView and let the query execution handle it
    }
  }

  dispatch(clearResults());
  dispatch(setQueryWithHistory(queryStringState));

  // If we have a valid DataView, update the dataset in the query state
  if (dataView && typeof dataView.toDataset === 'function') {
    const serializedDataset = dataView.toDataset();
    dispatch(setDataset(serializedDataset));
  }

  if (newPromptModeIsAvailable !== promptModeIsAvailable) {
    dispatch(setPromptModeIsAvailable(newPromptModeIsAvailable));
  }

  clearEditors();
  if (newPromptModeIsAvailable && editorMode !== EditorMode.SingleEmpty) {
    dispatch(setEditorMode(EditorMode.SingleEmpty));
  } else if (editorMode !== EditorMode.SingleQuery) {
    dispatch(setEditorMode(EditorMode.SingleQuery));
  }

  dispatch(executeQueries({ services }));
};
