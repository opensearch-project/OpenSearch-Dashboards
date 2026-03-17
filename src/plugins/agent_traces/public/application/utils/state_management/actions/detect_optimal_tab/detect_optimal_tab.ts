/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../../store';
import { setActiveTab } from '../../slices';
import { executeTabQuery } from '../query_actions';
import { AgentTracesServices } from '../../../../../types';
import {
  AGENT_TRACES_TRACES_TAB_ID,
  AGENT_TRACES_VISUALIZATION_TAB_ID,
} from '../../../../../../common';

/**
 * Returns true when the user query contains a stats/aggregation pipe.
 */
const hasStatsPipe = (queryString: string): boolean => /\|\s*stats\s/i.test(queryString);

/**
 * Detect the optimal tab based on the current query and sets it as active.
 * If the query contains a stats aggregation, switch to the Visualization tab
 * and execute its query; otherwise default to the Traces tab.
 */
export const detectAndSetOptimalTab = createAsyncThunk<
  void,
  { services: AgentTracesServices; savedTabId?: string },
  { state: RootState }
>('ui/detectAndSetOptimalTab', async ({ services }, { getState, dispatch }) => {
  const state = getState();
  const queryString = typeof state.query.query === 'string' ? state.query.query : '';

  if (hasStatsPipe(queryString)) {
    dispatch(setActiveTab(AGENT_TRACES_VISUALIZATION_TAB_ID));

    const tab = services.tabRegistry.getTab(AGENT_TRACES_VISUALIZATION_TAB_ID);
    if (tab?.prepareQuery) {
      const cacheKey = tab.prepareQuery(state.query);
      if (!state.results[cacheKey]) {
        await dispatch(executeTabQuery({ services, cacheKey, queryString: cacheKey }));
      }
    }
  } else {
    dispatch(setActiveTab(AGENT_TRACES_TRACES_TAB_ID));
  }
});
