/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { EuiEmptyPrompt, EuiLoadingSpinner, EuiPanel } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import {
  defaultPrepareQuery,
  defaultResultsProcessor,
} from '../utils/state_management/actions/query_actions';
import { useIndexPatternContext } from './index_pattern_context';
import {
  selectActiveTabId,
  selectQuery,
  selectResults,
  selectIsLoading,
  selectStatus,
  selectExecutionCacheKeys,
} from '../utils/state_management/selectors';

/**
 * Component that renders the content of the active tab
 * Processes raw results using tab's resultsProcessor before passing to tab component
 */
export const TabContent: React.FC = () => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const { indexPattern } = useIndexPatternContext();

  // Use memoized selectors
  const activeTabId = useSelector(selectActiveTabId);
  const query = useSelector(selectQuery);
  const isLoading = useSelector(selectIsLoading);
  const status = useSelector(selectStatus);
  const resultsState = useSelector((state: any) => state.results);
  const executionCacheKeys = useSelector(selectExecutionCacheKeys);

  // Get tabDefinition
  const tabDefinition = services.tabRegistry?.getTab?.(activeTabId);

  // Prepare query for the active tab
  const preparedQuery = useMemo(() => {
    const prepareQuery = tabDefinition?.prepareQuery || defaultPrepareQuery;
    return prepareQuery(query);
  }, [tabDefinition, query]);

  // Use executionCacheKeys from Redux instead of computing cache key
  // This ensures we use the same cache keys that were stored by executeQueries
  const cacheKey = useMemo(() => {
    // For logs tab or when queries are equal, use the first cache key
    // For other tabs, find the appropriate cache key
    if (!executionCacheKeys || executionCacheKeys.length === 0) {
      return null;
    }

    // Try all available cache keys to find one with results
    for (const key of executionCacheKeys) {
      if (resultsState && resultsState[key]) {
        return key;
      }
    }

    // If no results found, use the first cache key anyway (results might be loading)
    return executionCacheKeys[0];
  }, [executionCacheKeys, resultsState]);

  // Get raw results for this cache key
  const rawResults = cacheKey ? resultsState?.[cacheKey] : null;

  // Debug logging removed for production

  // Process results using tab's processor or default
  const processedResults = useMemo(() => {
    if (!rawResults) {
      return null;
    }

    const processor = tabDefinition?.resultsProcessor || defaultResultsProcessor;

    const processed = processor(rawResults, indexPattern);
    return processed;
  }, [rawResults, tabDefinition, indexPattern]);

  if (!tabDefinition) {
    return (
      <EuiEmptyPrompt
        title={<h2>Tab not found</h2>}
        body={<p>The selected tab could not be found.</p>}
      />
    );
  }

  const TabComponent = tabDefinition.component;

  return (
    <EuiPanel paddingSize="m">
      <Suspense fallback={<EuiLoadingSpinner size="l" />}>
        <TabComponent
          query={preparedQuery}
          results={processedResults} // Now passing PROCESSED results
          status={status}
          cacheKey={cacheKey || ''}
          error={null}
        />
      </Suspense>
    </EuiPanel>
  );
};
