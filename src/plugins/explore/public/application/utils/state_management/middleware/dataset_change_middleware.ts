/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Middleware } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import { DEFAULT_DATA } from 'src/plugins/data/common';
import { RootState } from '../store';
import { ExploreServices } from '../../../../types';
import {
  clearResults,
  setPromptModeIsAvailable,
  setActiveTab,
  clearLastExecutedData,
} from '../slices';
import { clearQueryStatusMap } from '../slices/query_editor/query_editor_slice';
import { executeQueries } from '../actions/query_actions';
import { getPromptModeIsAvailable } from '../../get_prompt_mode_is_available';
import { detectAndSetOptimalTab } from '../actions/detect_optimal_tab';

/**
 * Middleware to handle dataset changes and trigger necessary side effects
 * Likely this can be removed in favor for the query sync middleware
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

  let previousDataset: any = null;

  return (store) => (next) => async (action) => {
    const result = next(action);

    if (action.type === 'query/setQueryState' || action.type === 'query/setQueryWithHistory') {
      const state = store.getState();
      const currentDataset = state.query.dataset;

      if (!isEqual(previousDataset, currentDataset)) {
        previousDataset = currentDataset;

        store.dispatch(setActiveTab(''));
        store.dispatch(clearResults());
        store.dispatch(clearQueryStatusMap());
        store.dispatch(clearLastExecutedData());

        const newPromptModeIsAvailable = await getPromptModeIsAvailable(services);
        const currentPromptModeIsAvailable = state.queryEditor.promptModeIsAvailable;

        if (newPromptModeIsAvailable !== currentPromptModeIsAvailable) {
          store.dispatch(setPromptModeIsAvailable(newPromptModeIsAvailable));
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
    }

    return result;
  };
};
