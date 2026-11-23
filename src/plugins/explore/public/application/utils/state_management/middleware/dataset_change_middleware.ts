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
  clearLastExecutedData,
  setPatternsField,
  setUsingRegexPatterns,
  setActiveTab,
  setHideEmptyFields,
} from '../slices';
import {
  clearQueryStatusMap,
  setBreakdownField,
  setIsQueryEditorDirty,
  setIsSelectionStale,
} from '../slices/query_editor/query_editor_slice';
import { executeQueries } from '../actions/query_actions';
import { resetLegacyStateActionCreator } from '../actions/reset_legacy_state';
import { EXPLORE_NO_TAB_ID } from '../../../../../common';
import { datasetRequiresExplicitRun, isExplicitRunRefinement } from '../../requires_explicit_run';
import { refreshAiAvailability } from './ai_availability_middleware';

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
        query: { dataset },
      } = store.getState();

      if (isEqual(currentDataset, dataset)) return result;

      const previousDataset = currentDataset;
      currentDataset = dataset;

      if (
        action.meta?.refineSelection &&
        isExplicitRunRefinement(queryString, previousDataset, dataset)
      ) {
        // The picker refined the selection (same type, explicit Run): keep the results and the
        // view (columns, sort, breakdown, patterns) they're shown with until the user runs the
        // query on the new selection, as for an edited query, and mark them as stale meanwhile.
        store.dispatch(setIsQueryEditorDirty(true));
        store.dispatch(setIsSelectionStale(true));
      } else {
        store.dispatch(setIsSelectionStale(false));
        store.dispatch(setActiveTab(EXPLORE_NO_TAB_ID));
        store.dispatch(clearResults());
        store.dispatch(clearQueryStatusMap());
        store.dispatch(clearLastExecutedData());
        store.dispatch(setPatternsField(''));
        store.dispatch(setUsingRegexPatterns(false));
        // Which fields are empty is a property of the old dataset's results, so the opt-in doesn't
        // carry over: a new dataset starts from every column shown.
        store.dispatch(setHideEmptyFields(false));
        store.dispatch(setBreakdownField(undefined));
        store.dispatch(resetLegacyStateActionCreator(services) as unknown as AnyAction);
      }

      // Only gates the AI entry points, so the query below does not wait for it.
      store.dispatch(refreshAiAvailability());

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

          // A dataset type can require an explicit Run (meta.requiresExplicitRun): selecting or
          // switching to it then doesn't run the query (see above for what it keeps).
          if (!datasetRequiresExplicitRun(queryString, currentDataset)) {
            await store.dispatch(executeQueries({ services }) as any);
          }
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
