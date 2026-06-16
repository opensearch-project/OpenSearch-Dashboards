/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../state_management/store';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../../types';
import { defaultPrepareQueryString } from '../state_management/actions/query_actions';
import { selectPatternsField, selectSort } from '../state_management/selectors';
import { selectQueryStatusMapByKey } from '../state_management/selectors/query_editor/query_editor';
import { useOwnTabId } from '../../../components/tabs/tabs';

/**
 * Hook for reading tab specific result from result slice.
 *
 * Uses the tab's own ID from TabIdContext rather than the global activeTabId
 * from Redux.  This prevents hidden tabs from re-rendering when the user
 * switches tabs — their cache key stays the same so all downstream useMemo
 * hooks return cached values and the React.memo DataTable skips re-render.
 */
export const useTabResults = () => {
  const { services } = useOpenSearchDashboards<AgentTracesServices>();
  const query = useSelector((state: RootState) => state.query);
  const ownTabId = useOwnTabId();
  // When ownTabId is set (inside a tab panel), the selector returns a stable
  // value regardless of activeTabId changes — useSelector sees no change and
  // skips the re-render entirely.  Components outside tab panels (ownTabId='')
  // fall back to the global activeTabId.
  const tabId = useSelector((state: RootState) => ownTabId || state.ui.activeTabId);
  const patternsField = useSelector(selectPatternsField); // for use in updating dependency array of cacheKey
  const sort = useSelector(selectSort);

  const cacheKey = useMemo(() => {
    const tab = services.tabRegistry.getTab(tabId);
    const prepareQuery = tab?.prepareQuery || defaultPrepareQueryString;
    return prepareQuery(query, sort);
    // TODO: redo logic of using patternsField in dependency array when we have a better method to update cacheKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tabId, services, patternsField, sort]);

  // Select only the specific result by cache key instead of the entire results map
  const result = useSelector((state: RootState) => (cacheKey ? state.results[cacheKey] : null));
  const status = useSelector((state: RootState) => selectQueryStatusMapByKey(state, cacheKey));

  return {
    results: result,
    status,
  };
};
