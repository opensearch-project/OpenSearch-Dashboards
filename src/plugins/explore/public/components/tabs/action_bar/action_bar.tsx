/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { memo, useMemo } from 'react';
import { DiscoverResultsActionBar } from '../../../application/legacy/discover/application/components/results_action_bar/results_action_bar';
import { ExploreServices } from '../../../types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useSelector } from '../../../application/legacy/discover/application/utils/state_management';
import { selectSavedSearch } from '../../../application/utils/state_management/selectors';
import { useIndexPatternContext } from '../../../application/components/index_pattern_context';
import { ExploreFlavor } from '../../../../common';
import { RootState } from '../../../application/utils/state_management/store';
import { defaultPrepareQuery } from '../../../application/utils/state_management/actions/query_actions';

/**
 * Logs tab component for displaying log entries
 * Uses legacy components from discover and handles all content states
 */
const ActionBarComponent = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { indexPattern } = useIndexPatternContext();
  const { core } = services;

  const savedSearch = useSelector(selectSavedSearch);

  const query = useSelector((state: RootState) => state.query);
  const results = useSelector((state: RootState) => state.results);

  // Use default cache key computation for action bar (default component)
  const cacheKey = useMemo(() => {
    const queryString = typeof query.query === 'string' ? query.query : '';
    return defaultPrepareQuery(queryString);
  }, [query]);

  const rawResults = cacheKey ? results[cacheKey] : null;

  const rows = rawResults?.hits?.hits || [];
  const totalHits = (rawResults?.hits?.total as any)?.value || rawResults?.hits?.total || 0;
  const elapsedMs = rawResults?.elapsedMs;

  return (
    <DiscoverResultsActionBar
      hits={totalHits}
      showResetButton={!!savedSearch}
      resetQuery={() => {
        core.application.navigateToApp('explore', {
          path: `${ExploreFlavor.Logs}#/view/${savedSearch}`,
        });
      }}
      rows={rows}
      elapsedMs={elapsedMs}
      indexPattern={indexPattern}
    />
  );
};

export const ActionBar = memo(ActionBarComponent);
