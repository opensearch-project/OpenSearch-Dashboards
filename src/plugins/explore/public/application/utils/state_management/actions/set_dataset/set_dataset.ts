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
    query: { dataset },
  } = getState();

  const newPromptModeIsAvailable = await getPromptModeIsAvailable(services);

  let dataView;
  if (dataset && dataset.id) {
    await services.data.dataViews.ensureDefaultDataView();
    dataView = await services.data.dataViews.get(
      dataset.id,
      dataset.type ? dataset.type !== 'INDEX_PATTERN' : false
    );
  }

  dispatch(clearResults());
  dispatch(setQueryWithHistory(queryStringState));

  dispatch(
    setQueryWithHistory({
      ...queryStringState,
      ...(dataView ? { dataset: dataView.toDataset() } : {}),
    })
  );

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
