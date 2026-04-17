/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { RootState } from '../state_management/store';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { defaultPrepareQueryString } from '../state_management/actions/query_actions';
import { selectActiveTabId, selectPatternsField } from '../state_management/selectors';
import { selectQueryStatusMapByKey } from '../state_management/selectors/query_editor/query_editor';
import { resultsCache } from '../state_management/slices';

/**
 * Hook for reading tab specific result from result slice
 */
export const useTabResults = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const query = useSelector((state: RootState) => state.query);
  const activeTabId = useSelector(selectActiveTabId);
  const patternsField = useSelector(selectPatternsField); // for use in updating dependency array of cacheKey

  const cacheKey = useMemo(() => {
    const activeTab = services.tabRegistry.getTab(activeTabId);
    const prepareQuery = activeTab?.prepareQuery || defaultPrepareQueryString;
    return prepareQuery(query);
    // TODO: redo logic of using patternsField in dependency array when we have a better method to update cacheKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTabId, services, patternsField]);

  // metadata is the Redux reactivity trigger: useSelector re-renders this hook whenever
  // the metadata reference changes (i.e. when new results arrive). The actual hits are then
  // read from resultsCache, which was already populated by the middleware before Redux
  // notified this selector. Do not read hits from state.results — it holds metadata only.
  const metadata = useSelector((state: RootState) => (cacheKey ? state.results[cacheKey] : null));
  const status = useSelector((state: RootState) => selectQueryStatusMapByKey(state, cacheKey));

  return {
    results: metadata ? resultsCache.get(cacheKey) ?? null : null,
    status,
  };
};
