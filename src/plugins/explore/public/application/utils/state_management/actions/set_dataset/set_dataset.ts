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
  setUsingRegexPatterns,
  setPatternsField,
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
  dispatch(setPatternsField(''));
  dispatch(setUsingRegexPatterns(false));

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

  const [newPromptModeIsAvailable, newSummaryAgentIsAvailable] = await Promise.allSettled([
    getPromptModeIsAvailable(services),
    getSummaryAgentIsAvailable(services, query.dataset?.dataSource?.id!),
  ]);

  if (
    newPromptModeIsAvailable.status === 'fulfilled' &&
    newPromptModeIsAvailable.value !== promptModeIsAvailable
  ) {
    dispatch(setPromptModeIsAvailable(newPromptModeIsAvailable.value));
  }

  if (
    newSummaryAgentIsAvailable.status === 'fulfilled' &&
    newSummaryAgentIsAvailable.value !== summaryAgentIsAvailable
  ) {
    dispatch(setSummaryAgentIsAvailable(newSummaryAgentIsAvailable.value));
  }

  clearEditors();

  await dispatch(executeQueries({ services }));
  dispatch(detectAndSetOptimalTab({ services }));
};
