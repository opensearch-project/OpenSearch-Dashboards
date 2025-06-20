/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { memo } from 'react';
import { DiscoverResultsActionBar } from '../../../application/legacy/discover/application/components/results_action_bar/results_action_bar';
import { ExploreServices } from '../../../types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useSelector } from '../../../application/legacy/discover/application/utils/state_management';
import {
  selectRows,
  selectSavedSearch,
  selectTotalHits,
} from '../../../application/utils/state_management/selectors';
import { useIndexPatternContext } from '../../../application/components/index_pattern_context';
import { LOGS_VIEW_ID } from '../../../../common';

/**
 * Logs tab component for displaying log entries
 * Uses legacy components from discover and handles all content states
 */
const ActionBarComponent = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { indexPattern } = useIndexPatternContext();
  const { core } = services;

  const savedSearch = useSelector(selectSavedSearch);
  const rows = useSelector(selectRows);
  const totalHits = useSelector(selectTotalHits);

  return (
    <DiscoverResultsActionBar
      hits={totalHits}
      showResetButton={!!savedSearch}
      resetQuery={() => {
        core.application.navigateToApp('explore', {
          path: `${LOGS_VIEW_ID}#/view/${savedSearch}`,
        });
      }}
      rows={rows}
      indexPattern={indexPattern}
    />
  );
};

export const ActionBar = memo(ActionBarComponent);
