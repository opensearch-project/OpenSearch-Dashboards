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
  const queryStringState = services.data.query.queryString.getQuery();
  const {
    queryEditor: { editorMode, promptModeIsAvailable },
    query: { dataset },
  } = getState();

  let dataView;
  if (dataset && dataset.id) {
    await services.data.dataViews.ensureDefaultDataView();
    dataView = await services.data.dataViews.get(
      dataset.id,
      dataset.type ? dataset.type !== 'INDEX_PATTERN' : false
    );
  }

  dispatch(setActiveTab(''));
  dispatch(clearResults());
  dispatch(clearQueryStatusMap());
  dispatch(setQueryWithHistory(queryStringState));

  const datasetFromDataView = dataView ? await dataView.toDataset() : undefined;
  const updatedQuery = {
    ...queryStringState,
    ...(datasetFromDataView ? { dataset: datasetFromDataView } : {}),
  };

  dispatch(setQueryWithHistory(updatedQuery));
  await new Promise((resolve) => setTimeout(resolve, 100));
  const newPromptModeIsAvailable = await getPromptModeIsAvailable(services);

  if (newPromptModeIsAvailable !== promptModeIsAvailable) {
    dispatch(setPromptModeIsAvailable(newPromptModeIsAvailable));
  }

  clearEditors();
  if (newPromptModeIsAvailable && editorMode !== EditorMode.SingleEmpty) {
    dispatch(setEditorMode(EditorMode.SingleEmpty));
  } else if (!newPromptModeIsAvailable && editorMode !== EditorMode.SingleQuery) {
    dispatch(setEditorMode(EditorMode.SingleQuery));
  }

  await dispatch(executeQueries({ services }));
  dispatch(detectAndSetOptimalTab({ services }));
};
