/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { EuiText, EuiPanel, EuiSpacer } from '@elastic/eui';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../types';
import { TabComponentProps } from '../../../services/tab_registry/tab_registry_service';
import { ResultStatus } from '../../legacy/discover/application/view_components/utils/use_search';
import { DiscoverResultsActionBar } from '../../legacy/discover/application/components/results_action_bar/results_action_bar';
import { DiscoverTable } from '../../legacy/discover/application/view_components/canvas/discover_table';
import { DiscoverNoResults } from '../../legacy/discover/application/components/no_results/no_results';
import { DiscoverNoIndexPatterns } from '../../legacy/discover/application/components/no_index_patterns/no_index_patterns';
import { DiscoverUninitialized } from '../../legacy/discover/application/components/uninitialized/uninitialized';
import { LoadingSpinner } from '../../legacy/discover/application/components/loading_spinner/loading_spinner';
import {
  selectColumns,
  selectSort,
  selectSavedSearch,
} from '../../utils/state_management/selectors';

/**
 * Logs tab component for displaying log entries
 * Uses legacy components from discover and handles all content states
 */
const LogsTab: React.FC<TabComponentProps> = ({ query, results, status, error, cacheKey }) => {
  // Get services from context
  const { services } = useOpenSearchDashboards<ExploreServices>();

  // Get data from Redux store
  const savedSearch = useSelector(selectSavedSearch);

  // Create reset query function
  const resetQuery = () => {
    if (savedSearch && services?.core?.application) {
      services.core.application.navigateToApp('explore', {
        path: `#/view/${savedSearch}`,
      });
    }
  };

  // Get index pattern from the structured results (passed from query actions)
  // The query actions properly convert dataset to IndexPattern with all required methods including flattenHit
  const indexPattern = results?.indexPattern as any;
  const rows = (results as any)?.hits?.hits || [];

  // Create scroll to top function
  const scrollToTop = () => {
    window.scrollTo(0, 0);
  };

  // Create discover results action bar
  const discoverResultsActionBar = (
    <DiscoverResultsActionBar
      hits={rows.length}
      showResetButton={!!savedSearch}
      resetQuery={resetQuery}
      rows={rows}
      indexPattern={indexPattern}
    />
  );

  // Handle different states based on status and data availability
  if (!indexPattern) {
    // If we're loading, show loading spinner instead of no index patterns
    if (status === ResultStatus.LOADING) {
      return <LoadingSpinner />;
    }
    return (
      <>
        <EuiSpacer size="xxl" />
        <DiscoverNoIndexPatterns />
      </>
    );
  }

  // Handle NO_RESULTS status
  if (status === ResultStatus.NO_RESULTS) {
    return (
      <DiscoverNoResults
        queryString={services?.data?.query?.queryString}
        query={services?.data?.query?.queryString?.getQuery()}
        savedQuery={services?.data?.query?.savedQueries}
        timeFieldName={indexPattern.timeFieldName}
      />
    );
  }

  // Handle LOADING status with no existing data
  if (status === ResultStatus.LOADING && !rows?.length) {
    return <LoadingSpinner />;
  }

  // Handle ERROR status with no existing data
  if (status === ResultStatus.ERROR && !rows?.length) {
    return <DiscoverUninitialized onRefresh={() => window.location.reload()} />;
  }

  // Handle READY, LOADING with data, or ERROR with data states
  if (
    status === ResultStatus.READY ||
    (status === ResultStatus.LOADING && !!rows?.length) ||
    (status === ResultStatus.ERROR && !!rows?.length)
  ) {
    // Structure the results data for DiscoverTable
    // DiscoverTable expects: { hits: { hits: [...] }, indexPattern: ... }
    const structuredResults = {
      hits: {
        hits: (results as any)?.hits?.hits || [],
      },
      indexPattern,
    };

    return (
      <>
        {discoverResultsActionBar}
        <DiscoverTable scrollToTop={scrollToTop} cacheKey={cacheKey} results={structuredResults} />
      </>
    );
  }

  // Fallback for any unhandled states
  return <EuiText>No logs found.</EuiText>;
};

// Named export to avoid default export linting error
export { LogsTab };
