/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { useSelector } from 'react-redux';
import { EuiEmptyPrompt, EuiLoadingSpinner, EuiPanel } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import {
  selectActiveTabId,
  selectQuery,
  selectResults,
  selectIsLoading,
  selectStatus,
} from '../utils/state_management/selectors';

/**
 * Component that renders the content of the active tab
 * Uses memoized selectors for optimal performance
 */
export const TabContent: React.FC = () => {
  // Get services from context
  const { services } = useOpenSearchDashboards<ExploreServices>();

  // Use memoized selectors to get state - all hooks must be called at top level
  const activeTabId = useSelector(selectActiveTabId);
  const query = useSelector(selectQuery);
  const isLoading = useSelector(selectIsLoading);
  const status = useSelector(selectStatus);
  const results = useSelector(selectResults);

  // Get tabDefinition from services context instead of Redux
  const tabDefinition = services.tabRegistry?.getTab?.(activeTabId);

  // Get timeRange from services instead of Redux
  const timeRange = services.data?.query?.timefilter?.timefilter?.getTime() || {
    from: 'now-15m',
    to: 'now',
  };

  if (!tabDefinition) {
    return (
      <EuiEmptyPrompt
        title={<h2>Tab not found</h2>}
        body={<p>The selected tab could not be found.</p>}
      />
    );
  }

  // Get the tab component
  const TabComponent = tabDefinition.component;

  // Prepare query for the active tab
  const preparedQuery = tabDefinition.prepareQuery(query);

  // Calculate cache key using preparedQuery (this is the correct approach)
  const cacheKey = `${preparedQuery.query}_${timeRange.from}_${timeRange.to}`;

  return (
    <EuiPanel paddingSize="m">
      <Suspense fallback={<EuiLoadingSpinner size="l" />}>
        <TabComponent
          query={preparedQuery}
          results={results || {}}
          status={status}
          cacheKey={cacheKey}
          error={null}
        />
      </Suspense>
    </EuiPanel>
  );
};
