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
import { useIndexPatternContext } from '../../../application/components/index_pattern_context';
import { ExploreFlavor } from '../../../../common';
import { useTabResults } from '../../../application/utils/hooks/use_tab_results';

/**
 * Logs tab component for displaying log entries
 * Uses legacy components from discover and handles all content states
 */
const ActionBarComponent = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { indexPattern } = useIndexPatternContext();
  const { results } = useTabResults();
  const { core } = services;

  const savedSearch = useSelector(selectSavedSearch);
  const { inspector, inspectorAdapters } = services;

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
      indexPattern={indexPattern}
      inspectionHanlder={openInspector}
    />
  );
};

export const ActionBar = memo(ActionBarComponent);
