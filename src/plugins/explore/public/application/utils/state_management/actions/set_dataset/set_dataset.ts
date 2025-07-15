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
  setActiveTab,
} from '../../slices';
import { clearQueryStatusMap } from '../../slices/query_editor/query_editor_slice';
import { executeQueries } from '../query_actions';
import { getPromptModeIsAvailable } from '../../../get_prompt_mode_is_available';
import { EditorMode } from '../../types';
import { useClearEditors } from '../../../../hooks';
import { detectAndSetOptimalTab } from '../detect_optimal_tab';

export const setDatasetActionCreator = (
  services: ExploreServices,
  clearEditors: ReturnType<typeof useClearEditors>
) => async (dispatch: AppDispatch, getState: () => RootState) => {
  const {
    data: {
      dataViews,
      query: { queryString },
    },
  } = services;
  const currentQuery = queryString.getQuery();
  const {
    queryEditor: { editorMode, promptModeIsAvailable },
    query,
  } = getState();

  dispatch(setActiveTab(''));
  dispatch(clearResults());
  dispatch(clearQueryStatusMap());

  await dataViews.ensureDefaultDataView();
  const dataView = query.dataset
    ? await dataViews
        .get(query.dataset.id, query.dataset.type !== 'INDEX_PATTERN')
        .catch(() => dataViews.createFromDataset(query.dataset!))
    : await dataViews.getDefault();

  const updatedQuery = {
    ...currentQuery,
    ...(dataView ? { dataset: dataViews.convertToDataset(dataView) } : {}),
  };

  dispatch(setQueryWithHistory(updatedQuery));

  const newPromptModeIsAvailable = await getPromptModeIsAvailable(services);
  if (newPromptModeIsAvailable !== promptModeIsAvailable) {
    dispatch(setPromptModeIsAvailable(newPromptModeIsAvailable));
  }

  clearEditors();

  if (newPromptModeIsAvailable && editorMode === EditorMode.SingleQuery) {
    dispatch(setEditorMode(EditorMode.SingleEmpty));
  } else if (!newPromptModeIsAvailable && editorMode === EditorMode.SingleEmpty) {
    dispatch(setEditorMode(EditorMode.SingleQuery));
  }

  await dispatch(executeQueries({ services }));
  dispatch(detectAndSetOptimalTab({ services }));
};
