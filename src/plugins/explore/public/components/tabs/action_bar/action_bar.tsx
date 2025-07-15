/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { memo } from 'react';
import { DiscoverResultsActionBar } from './results_action_bar/results_action_bar';
import { ExploreServices } from '../../../types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useSelector } from '../../../application/legacy/discover/application/utils/state_management';
import { selectSavedSearch } from '../../../application/utils/state_management/selectors';
import { useDatasetContext } from '../../../application/context';
import { ExploreFlavor } from '../../../../common';
import { useTabResults } from '../../../application/utils/hooks/use_tab_results';
import { useSearchContext } from '../../query_panel/utils/use_search_context';

/**
 * Logs tab component for displaying log entries
 * Uses legacy components from discover and handles all content states
 */
const ActionBarComponent = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { dataset } = useDatasetContext();
  const { results } = useTabResults();
  const { core, inspector, inspectorAdapters } = services;
  const savedSearch = useSelector(selectSavedSearch);
  const searchContext = useSearchContext();

  const openInspector = () => {
    if (inspector) {
      inspector.open(inspectorAdapters, {
        title: savedSearch,
      });
    }
  };

  const rows = results?.hits?.hits || [];
  const totalHits = (results?.hits?.total as any)?.value || results?.hits?.total || 0;
  const elapsedMs = results?.elapsedMs;

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
      dataset={dataset}
      inspectionHanlder={openInspector}
      searchContext={searchContext}
      services={services}
    />
  );
};

export const ActionBar = memo(ActionBarComponent);
