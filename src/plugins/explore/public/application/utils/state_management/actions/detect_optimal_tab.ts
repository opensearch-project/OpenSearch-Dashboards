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

const hasStatsOrTable = (q: string) => /\|\s*(stats|table)\b/i.test(q);
const hasChartOrTimechart = (q: string) => /\|\s*(chart|timechart)\b/i.test(q);

/**
 * Determines the optimal tab based on the current query and the user's
 * current tab selection, then dispatches setActiveTab once.
 *
 * Decision matrix:
 *
 * | Current Tab ↓ \ Query →  | stats/table    | chart/timechart  | No command      |
 * |--------------------------|----------------|------------------|-----------------|
 * | Logs (default)           | → Statistic    | → Visualization  | → Logs (stay)   |
 * | Statistic                | → Statistic    | → Statistic      | → Logs          |
 * | Visualization            | → Visualization| → Visualization  | → Visualization |
 */
export const detectAndSetOptimalTab = createAsyncThunk<
  void,
  { services: ExploreServices },
  { state: RootState }
>('ui/detectAndSetOptimalTab', async (_args, { getState, dispatch }) => {
  const state = getState();
  const queryString = typeof state.query.query === 'string' ? state.query.query : '';
  const currentTab = state.ui.activeTabId || EXPLORE_LOGS_TAB_ID;

  let targetTab: string;

  switch (currentTab) {
    case EXPLORE_LOGS_TAB_ID:
      if (hasStatsOrTable(queryString)) {
        targetTab = EXPLORE_STATISTICS_TAB_ID;
      } else if (hasChartOrTimechart(queryString)) {
        targetTab = EXPLORE_VISUALIZATION_TAB_ID;
      } else {
        targetTab = EXPLORE_LOGS_TAB_ID;
      }
      break;

    case EXPLORE_STATISTICS_TAB_ID:
      if (hasStatsOrTable(queryString) || hasChartOrTimechart(queryString)) {
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
