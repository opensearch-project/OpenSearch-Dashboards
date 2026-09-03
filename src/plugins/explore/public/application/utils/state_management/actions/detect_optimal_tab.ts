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
import { AGGREGATION_COMMAND_PATTERN } from '../../languages/ppl/aggregation_commands';
import { maskPPLSubqueriesAndStrings } from '../../languages/ppl/mask_ppl_subqueries_and_strings';

// The bucketing aggregations (AGGREGATION_COMMANDS: stats/top/rare) and `table` all produce
// non-document output that belongs on the Statistics tab. The aggregation set is shared with
// stripStatsFromQuery and the bucket-count summary so the three stay in sync; `table` is routed
// here only (it is a projection, so it keeps hit-count semantics and is not stripped). Both
// predicates run on the masked query (see the thunk) so a command inside a string or subquery
// doesn't mis-route the tab, matching how stripStatsFromQuery and the bucket-count gate mask.
const hasAggregation = (masked: string) =>
  new RegExp(`\\|\\s*(${AGGREGATION_COMMAND_PATTERN}|table)\\b`, 'i').test(masked);
const hasChartOrTimechart = (masked: string) => /\|\s*(chart|timechart)\b/i.test(masked);

/**
 * Determines the optimal tab based on the current query and the user's
 * current tab selection, then dispatches setActiveTab once.
 *
 * Decision matrix:
 *
 * | Current Tab ↓ \ Query →  | stats/table/top/rare | chart/timechart  | No command      |
 * |--------------------------|----------------------|------------------|-----------------|
 * | Logs (default)           | → Statistic          | → Visualization  | → Logs (stay)   |
 * | Statistic                | → Statistic          | → Statistic      | → Logs          |
 * | Visualization            | → Visualization      | → Visualization  | → Visualization |
 */
export const detectAndSetOptimalTab = createAsyncThunk<
  void,
  { services: ExploreServices },
  { state: RootState }
>('ui/detectAndSetOptimalTab', async (_args, { getState, dispatch }) => {
  const state = getState();
  const queryString = typeof state.query.query === 'string' ? state.query.query : '';
  const maskedQuery = maskPPLSubqueriesAndStrings(queryString);
  const currentTab = state.ui.activeTabId || EXPLORE_LOGS_TAB_ID;

  let targetTab: string;

  switch (currentTab) {
    case EXPLORE_LOGS_TAB_ID:
      if (hasAggregation(maskedQuery)) {
        targetTab = EXPLORE_STATISTICS_TAB_ID;
      } else if (hasChartOrTimechart(maskedQuery)) {
        targetTab = EXPLORE_VISUALIZATION_TAB_ID;
      } else {
        targetTab = EXPLORE_LOGS_TAB_ID;
      }
      break;

    case EXPLORE_STATISTICS_TAB_ID:
      if (hasAggregation(maskedQuery) || hasChartOrTimechart(maskedQuery)) {
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
