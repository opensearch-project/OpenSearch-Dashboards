/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiSpacer } from '@elastic/eui';
import { RootState } from '../../../../application/utils/state_management/store';
import { QueryExecutionStatus } from '../../../../application/utils/state_management/types';
import { CanvasPanel } from '../../../panel/canvas_panel';
import { DiscoverNoIndexPatterns } from '../../../../application/legacy/discover/application/components/no_index_patterns/no_index_patterns';
import { DiscoverUninitialized } from '../../../../application/legacy/discover/application/components/uninitialized/uninitialized';
import { LoadingSpinner } from '../../../../application/legacy/discover/application/components/loading_spinner/loading_spinner';
import { DiscoverNoResults } from '../../../../application/legacy/discover/application/components/no_results/no_results';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../../../types';
import { executeQueries } from '../../../../application/utils/state_management/actions/query_actions';
import { ExploreTabs } from '../../../../components/tabs/tabs';
import { ResultsSummaryPanel } from '../../../../components/results_summary/results_summary_panel';
import { DiscoverChartContainer } from '../../../../components/chart/discover_chart_container';
import { useDatasetContext } from '../../../../application/context';
import { ErrorPanel } from '../../../error_panel';

export const BottomRightContainer = () => {
  const dispatch = useDispatch();
  const { dataset } = useDatasetContext();
  const { services } = useOpenSearchDashboards<ExploreServices>();

  const onRefresh = () => {
    if (services) {
      dispatch(executeQueries({ services }));
    }
  };

  const status = useSelector((state: RootState) => {
    return state.queryEditor.overallQueryStatus.status || QueryExecutionStatus.UNINITIALIZED;
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

  if (status === QueryExecutionStatus.LOADING) {
    return (
      <CanvasPanel>
        <LoadingSpinner />
      </CanvasPanel>
    );
  }

  if (status === QueryExecutionStatus.ERROR) {
    return <ErrorPanel />;
  }

  if (status === QueryExecutionStatus.READY) {
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
