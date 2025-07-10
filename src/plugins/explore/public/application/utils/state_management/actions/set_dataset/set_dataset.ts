/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../../../../types';
import { AppDispatch, RootState } from '../../store';
import {
  clearResults,
  setPromptModeIsAvailable,
  setQueryWithHistory,
  setActiveTab,
  clearLastExecutedData,
  setSummaryAgentIsAvailable,
} from '../../slices';
import { clearQueryStatusMap } from '../../slices/query_editor/query_editor_slice';
import { executeQueries } from '../query_actions';
import { getPromptModeIsAvailable } from '../../../get_prompt_mode_is_available';
import { useClearEditors } from '../../../../hooks';
import { detectAndSetOptimalTab } from '../detect_optimal_tab';
import { getSummaryAgentIsAvailable } from '../../../get_summary_agent_is_available';

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
    queryEditor: { promptModeIsAvailable, summaryAgentIsAvailable },
    query,
  } = getState();

  dispatch(setActiveTab(''));
  dispatch(clearResults());
  dispatch(clearQueryStatusMap());
  dispatch(clearLastExecutedData());

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

  const newSummaryAgentIsAvailable = await getSummaryAgentIsAvailable(
    services,
    query.dataset?.dataSource?.id!
  );
  if (newSummaryAgentIsAvailable !== summaryAgentIsAvailable) {
    dispatch(setSummaryAgentIsAvailable(newSummaryAgentIsAvailable));
  }

  clearEditors();

  await dispatch(executeQueries({ services }));
  dispatch(detectAndSetOptimalTab({ services }));
};
