/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../../types';
import { useEditorText, useSetEditorTextWithQuery } from '../../../hooks';
import { setActiveTab, clearQueryStatusMapByKey } from '../../../utils/state_management/slices';
import { loadQueryActionCreator } from '../../../utils/state_management/actions/query_editor';
import { executeTabQuery } from '../../../utils/state_management/actions/query_actions';
import { AGENT_TRACES_TRACES_TAB_ID, AGENT_TRACES_SPANS_TAB_ID } from '../../../../../common';
import { AppDispatch, RootState } from '../../../utils/state_management/store';

const ERROR_FILTER = '| where `status.code` = 2';

/**
 * Returns a click handler for error count links in the metrics bar.
 * On click it appends a `| where \`status.code\` = 2` filter to the query,
 * switches to the target tab (traces or spans), and executes the query.
 */
export const useErrorFilterClick = () => {
  const dispatch = useDispatch();
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const getEditorText = useEditorText();
  const setEditorTextWithQuery = useSetEditorTextWithQuery();

  return useCallback(
    async (target: 'traces' | 'spans') => {
      const currentText = getEditorText();
      const newText = currentText.includes('`status.code` = 2')
        ? currentText
        : `${currentText} ${ERROR_FILTER}`.trim();

      const targetTabId =
        target === 'traces' ? AGENT_TRACES_TRACES_TAB_ID : AGENT_TRACES_SPANS_TAB_ID;
      await dispatch(loadQueryActionCreator(services, setEditorTextWithQuery, newText) as any);
      dispatch(setActiveTab(targetTabId));

      // Execute the tab-specific query using fresh state after loadQueryActionCreator
      dispatch(((d: AppDispatch, getState: () => RootState) => {
        const state = getState();
        const tab = services.tabRegistry.getTab(targetTabId);
        if (!tab?.prepareQuery) return;
        const cacheKey = tab.prepareQuery(state.query, state.legacy.sort);
        if (!state.results[cacheKey]) {
          d(clearQueryStatusMapByKey(cacheKey));
          d(executeTabQuery({ services, cacheKey, queryString: cacheKey }));
        }
      }) as any);
    },
    [dispatch, services, getEditorText, setEditorTextWithQuery]
  );
};
