/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../../../../types';
import { AppDispatch, RootState } from '../../store';
import {
  clearResults,
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
  } = getState();

  const newPromptModeIsAvailable = await getPromptModeIsAvailable(services);

  dispatch(clearResults());
  dispatch(setQueryWithHistory(queryStringState));

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
