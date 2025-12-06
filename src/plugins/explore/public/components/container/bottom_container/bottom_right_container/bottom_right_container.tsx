/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { EuiSpacer } from '@elastic/eui';
import { selectQueryStatusMapByKey } from '../../../../application/utils/state_management/selectors';
import { RootState } from '../../../../application/utils/state_management/store';
import { QueryExecutionStatus } from '../../../../application/utils/state_management/types';
import { CanvasPanel } from '../../../panel/canvas_panel';
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
import { DiscoverChartContainer } from '../../../../components/chart/discover_chart_container';
import { useDatasetContext } from '../../../../application/context';
import { ResizableVisControlAndTabs } from './resizable_vis_control_and_tabs';
import { useFlavorId } from '../../../../helpers/use_flavor_id';
import { ExploreFlavor } from '../../../../../common';

export const BottomRightContainer = () => {
  const dispatch = useDispatch();
  const { dataset } = useDatasetContext();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const flavorId = useFlavorId();

  const onRefresh = () => {
    if (services) {
      dispatch(executeQueries({ services }));
    }
  };

  const query = useSelector((state: RootState) => state.query);
  const status = useSelector((state: RootState) => {
    return state.queryEditor.overallQueryStatus.status || QueryExecutionStatus.UNINITIALIZED;
  });
  const dataTableStatus = useSelector((state: RootState) => {
    return selectQueryStatusMapByKey(state, defaultPrepareQueryString(query))?.status;
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

  if (status === QueryExecutionStatus.LOADING && dataTableStatus === QueryExecutionStatus.LOADING) {
    return (
      <CanvasPanel>
        <LoadingSpinner />
      </CanvasPanel>
    );
  }

  if (
    dataTableStatus === QueryExecutionStatus.READY ||
    dataTableStatus === QueryExecutionStatus.ERROR ||
    status === QueryExecutionStatus.READY ||
    status === QueryExecutionStatus.ERROR
  ) {
    return (
      <>
        <DiscoverChartContainer />
        <CanvasPanel>
          <ResizableVisControlAndTabs />
        </CanvasPanel>
      </>
    );
  }

  return null;
};
