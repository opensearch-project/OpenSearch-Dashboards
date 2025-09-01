/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Middleware } from '@reduxjs/toolkit';
import { AnyAction } from 'redux';
import { isEqual } from 'lodash';
import { Dataset, DEFAULT_DATA } from '../../../../../../data/common';
import { RootState } from '../store';
import { ExploreServices } from '../../../../types';
import {
  clearResults,
  setPromptModeIsAvailable,
  setActiveTab,
  clearLastExecutedData,
  setSummaryAgentIsAvailable,
  setPatternsField,
  setUsingRegexPatterns,
} from '../slices';
import { clearQueryStatusMap } from '../slices/query_editor/query_editor_slice';
import { executeQueries } from '../actions/query_actions';
import { getPromptModeIsAvailable } from '../../get_prompt_mode_is_available';
import { getSummaryAgentIsAvailable } from '../../get_summary_agent_is_available';
import { detectAndSetOptimalTab } from '../actions/detect_optimal_tab';
import { resetLegacyStateActionCreator } from '../actions/reset_legacy_state';

/**
 * Middleware to handle dataset changes and trigger necessary side effects
 * TODO: followup with if this is necessary, or this can be removed in favor for the query sync middleware
 */
export const createDatasetChangeMiddleware = (
  services: ExploreServices
): Middleware<{}, RootState> => {
  const {
    data: {
      query: { queryString },
    },
  } = services;
  const datasetService = queryString.getDatasetService();
  let currentDataset: Dataset | undefined;

  return (store) => (next) => async (action) => {
    const result = next(action);

    if (action.type === 'query/setQueryState' || action.type === 'query/setQueryWithHistory') {
      const {
        queryEditor,
        query: { dataset },
      } = store.getState();

      if (isEqual(currentDataset, dataset)) return result;

      currentDataset = dataset;

      store.dispatch(setActiveTab(''));
      store.dispatch(clearResults());
      store.dispatch(clearQueryStatusMap());
      store.dispatch(clearLastExecutedData());
      store.dispatch(setPatternsField(''));
      store.dispatch(setUsingRegexPatterns(false));
      store.dispatch((resetLegacyStateActionCreator(services) as unknown) as AnyAction);

      const [newPromptModeIsAvailable, newSummaryAgentIsAvailable] = await Promise.allSettled([
        getPromptModeIsAvailable(services),
        getSummaryAgentIsAvailable(services, currentDataset?.dataSource?.id || ''),
      ]);

      if (
        newPromptModeIsAvailable.status === 'fulfilled' &&
        newPromptModeIsAvailable.value !== queryEditor.promptModeIsAvailable
      ) {
        store.dispatch(setPromptModeIsAvailable(newPromptModeIsAvailable.value));
      }

      if (
        newSummaryAgentIsAvailable.status === 'fulfilled' &&
        newSummaryAgentIsAvailable.value !== queryEditor.summaryAgentIsAvailable
      ) {
        store.dispatch(setSummaryAgentIsAvailable(newSummaryAgentIsAvailable.value));
      }

      if (currentDataset) {
        try {
          if (datasetService && currentDataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN) {
            await datasetService.cacheDataset(
              currentDataset,
              {
                ...services,
                storage: services.storage as any,
              },
              false
            );
          }

          await store.dispatch(executeQueries({ services }) as any);
          store.dispatch(detectAndSetOptimalTab({ services }) as any);
        } catch (error) {
          services.notifications?.toasts.addError(error, {
            title: 'Error loading dataset',
          });
        }
      }
    }

    return result;
  };
};
