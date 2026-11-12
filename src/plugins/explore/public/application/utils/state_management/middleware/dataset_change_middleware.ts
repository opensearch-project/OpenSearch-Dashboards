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
  clearLastExecutedData,
  setSummaryAgentIsAvailable,
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
import {
  abortAllActiveQueries,
  executeQueries,
  supersedeAllActiveQueries,
} from '../actions/query_actions';
import { abortAllStreamingQueries } from '../../streaming/streaming_abort_registry';
import { getPromptModeIsAvailable } from '../../get_prompt_mode_is_available';
import { getSummaryAgentIsAvailable } from '../../get_summary_agent_is_available';
import { resetLegacyStateActionCreator } from '../actions/reset_legacy_state';
import { EXPLORE_NO_TAB_ID } from '../../../../../common';
import { datasetRequiresExplicitRun, isExplicitRunRefinement } from '../../requires_explicit_run';

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
    const isQueryStateAction =
      action.type === 'query/setQueryState' || action.type === 'query/setQueryWithHistory';
    // The dataset the page showed before this action.
    const datasetBefore = isQueryStateAction ? store.getState().query?.dataset : undefined;
    const result = next(action);

    if (isQueryStateAction) {
      const {
        queryEditor,
        query: { dataset },
      } = store.getState();

      if (isEqual(currentDataset, dataset)) return result;

      // Until the first of these actions (a page opened from a URL or reloaded has dispatched
      // none), the dataset the page loaded with is the previous one.
      const previousDataset = currentDataset ?? datasetBefore;
      currentDataset = dataset;

      // The picker re-applied the selection the page already shows: nothing changed.
      if (action.meta?.refineSelection && isEqual(previousDataset, dataset)) return result;

      if (
        action.meta?.refineSelection &&
        isExplicitRunRefinement(queryString, previousDataset, dataset)
      ) {
        // The picker refined the selection (same type, explicit Run): keep the results and the
        // view (columns, sort, breakdown, patterns) they're shown with until the user runs the
        // query on the new selection, as for an edited query, and mark them as stale meanwhile.
        // A query still running is for the previous selection: stop it, as Stop does (it keeps
        // what has finished, and the user runs the query on the new selection).
        abortAllActiveQueries();
        abortAllStreamingQueries();
        store.dispatch(setIsQueryEditorDirty(true));
        store.dispatch(setIsSelectionStale(true));
      } else {
        // The results and statuses below are cleared, so the queries for the previous dataset
        // must stop too: their rows would otherwise land under this one when they finish.
        supersedeAllActiveQueries();
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
