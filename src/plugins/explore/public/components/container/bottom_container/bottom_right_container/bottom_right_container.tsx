/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiSpacer } from '@elastic/eui';
import { RootState } from '../../../../application/utils/state_management/store';
import { QueryExecutionStatus } from '../../../../application/utils/state_management/types';
import { CanvasPanel } from '../../../../application/legacy/discover/application/components/panel/canvas_panel';
import { DiscoverNoIndexPatterns } from '../../../../application/legacy/discover/application/components/no_index_patterns/no_index_patterns';
import { DiscoverUninitialized } from '../../../../application/legacy/discover/application/components/uninitialized/uninitialized';
import { LoadingSpinner } from '../../../../application/legacy/discover/application/components/loading_spinner/loading_spinner';
import { DiscoverNoResults } from '../../../../application/legacy/discover/application/components/no_results/no_results';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import {
  executeQueries,
  defaultPrepareQueryString,
} from '../../../../application/utils/state_management/actions/query_actions';
import { ExploreTabs } from '../../../../components/tabs/tabs';
import { ResultsSummaryPanel } from '../../../../components/results_summary/results_summary_panel';
import { DiscoverChartContainer } from '../../../../components/chart/discover_chart_container';
import { useDatasetContext } from '../../../../application/context';

export const BottomRightContainer = () => {
  const { dataset } = useDatasetContext();
  const dispatch = useDispatch();

  const { services } = useOpenSearchDashboards<ExploreServices>();

  // Function to refresh data (for uninitialized state)
  const onRefresh = () => {
    if (services) {
      dispatch(executeQueries({ services }));
    }
  };

  // Get status for conditional rendering
  const status = useSelector((state: RootState) => {
    return state.queryEditor.queryStatus.status || QueryExecutionStatus.UNINITIALIZED;
  });

  const rows = useSelector((state: RootState) => {
    const query = state.query;
    const results = state.results;

    const cacheKey = defaultPrepareQueryString(query);
    const rawResults = results.hasOwnProperty(cacheKey) ? results[cacheKey] : null;

    if (rawResults) {
      const hits = rawResults.hits?.hits || [];
      return hits;
    }

    return [];
  });

  if (dataset == null) {
    return (
      <CanvasPanel>
        <>
          <EuiSpacer size="xxl" />
          <DiscoverNoIndexPatterns />
        </>
      </CanvasPanel>
    );
  }

  if (status === QueryExecutionStatus.NO_RESULTS) {
    return (
      <CanvasPanel>
        <DiscoverNoResults
          queryString={services?.data?.query?.queryString}
          query={services?.data?.query?.queryString?.getQuery()}
          savedQuery={services?.data?.query?.savedQueries}
          timeFieldName={dataset.timeFieldName}
        />
      </CanvasPanel>
    );
  }

  if (status === QueryExecutionStatus.UNINITIALIZED) {
    return (
      <CanvasPanel>
        <DiscoverUninitialized onRefresh={onRefresh} />
      </CanvasPanel>
    );
  }

  if (status === QueryExecutionStatus.LOADING && !rows?.length) {
    return (
      <CanvasPanel>
        <LoadingSpinner />
      </CanvasPanel>
    );
  }

  if (status === QueryExecutionStatus.ERROR && !rows?.length) {
    return (
      <CanvasPanel>
        <DiscoverUninitialized onRefresh={onRefresh} />
      </CanvasPanel>
    );
  }

  if (
    status === QueryExecutionStatus.READY ||
    (status === QueryExecutionStatus.LOADING && !!rows?.length) ||
    (status === QueryExecutionStatus.ERROR && !!rows?.length)
  ) {
    return (
      <>
        <ResultsSummaryPanel />
        <DiscoverChartContainer />
        <CanvasPanel>
          <ExploreTabs />
        </CanvasPanel>
      </>
    );
  }

  return null;
};
