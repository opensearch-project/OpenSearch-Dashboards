/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { setActiveTab } from '../slices';
import { ExploreServices } from '../../../../types';
import {
  EXPLORE_LOGS_TAB_ID,
  EXPLORE_STATISTICS_TAB_ID,
  EXPLORE_VISUALIZATION_TAB_ID,
} from '../../../../../common';
import {
  ensurePatternsDefaultMode,
  getPatternsDefaultMode,
  maskedPPLQueryHasTrait,
  patternsDefaultModeNeedsFetch,
  PPLTraitOptions,
} from '../../languages/ppl/aggregation_commands';
import { maskPPLSubqueriesAndStrings } from '../../languages/ppl/mask_ppl_subqueries_and_strings';

// Derived from the shared PPL command traits, so every command stripped from the Logs/histogram
// query is routed off the Logs tab (otherwise Logs would silently show the stripped documents).
// Both predicates run on the masked query (see the thunk) so a command inside a string or subquery
// doesn't mis-route the tab, matching how stripStatsFromQuery and the bucket-count gate mask.
const routesToStatistics = (masked: string, options: PPLTraitOptions) =>
  maskedPPLQueryHasTrait(masked, (traits) => traits.routesTo === 'statistics', options);
const routesToVisualization = (masked: string, options: PPLTraitOptions) =>
  maskedPPLQueryHasTrait(masked, (traits) => traits.routesTo === 'visualization', options);

/**
 * Determines the optimal tab based on the current query and the user's
 * current tab selection, then dispatches setActiveTab once.
 *
 * Decision matrix:
 *
 * | Current Tab ↓ \ Query →  | Statistics command¹  | Visualization command² | No command      |
 * |--------------------------|----------------------|------------------------|-----------------|
 * | Logs (default)           | → Statistic          | → Visualization        | → Logs (stay)   |
 * | Statistic                | → Statistic          | → Statistic            | → Logs          |
 * | Visualization            | → Visualization      | → Visualization        | → Visualization |
 *
 * ¹ stats, top, rare, table, transpose, xyseries, and `patterns` when it aggregates (explicit
 *   `mode=aggregation`, or no `mode=` on a cluster whose default mode is aggregation)
 * ² chart, timechart, timewrap
 * (see PPL_COMMAND_TRAITS; a Statistics command wins when both are present)
 */
export const detectAndSetOptimalTab = createAsyncThunk<
  void,
  { services: ExploreServices },
  { state: RootState }
>('ui/detectAndSetOptimalTab', async ({ services }, { getState, dispatch }) => {
  const state = getState();
  const queryString = typeof state.query.query === 'string' ? state.query.query : '';
  const maskedQuery = maskPPLSubqueriesAndStrings(queryString);
  // A `patterns` without `mode=` aggregates only if the cluster default says so. Awaited only when
  // the setting must be fetched: every other query sets the tab synchronously, in the same tick as
  // the state changes that dispatched this (e.g. the New button's reset), so they render together.
  if (patternsDefaultModeNeedsFetch(state.query)) {
    await ensurePatternsDefaultMode(services?.http, state.query);
  }
  const options: PPLTraitOptions = { patternsDefaultMode: getPatternsDefaultMode(state.query) };
  const currentTab = state.ui.activeTabId || EXPLORE_LOGS_TAB_ID;

  let targetTab: string;

  switch (currentTab) {
    case EXPLORE_LOGS_TAB_ID:
      if (routesToStatistics(maskedQuery, options)) {
        targetTab = EXPLORE_STATISTICS_TAB_ID;
      } else if (routesToVisualization(maskedQuery, options)) {
        targetTab = EXPLORE_VISUALIZATION_TAB_ID;
      } else {
        targetTab = EXPLORE_LOGS_TAB_ID;
      }
      break;

    case EXPLORE_STATISTICS_TAB_ID:
      if (routesToStatistics(maskedQuery, options) || routesToVisualization(maskedQuery, options)) {
        targetTab = EXPLORE_STATISTICS_TAB_ID;
      } else {
        targetTab = EXPLORE_LOGS_TAB_ID;
      }
      break;

    case EXPLORE_VISUALIZATION_TAB_ID:
      targetTab = EXPLORE_VISUALIZATION_TAB_ID;
      break;

    default:
      targetTab = currentTab;
  }

  dispatch(setActiveTab(targetTab));
});
