/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';
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
import { TraceAutoDetectCallout } from '../../../trace_auto_detect_callout';
import { getSourceTypeRegistry } from '../../../../services/source_type_registry';

export const BottomRightContainer = () => {
  const dispatch = useDispatch();
  const { dataset } = useDatasetContext();
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const flavorId = useFlavorId();

  const onRefresh = () => {
    if (services) {
      // @ts-expect-error TS2345 TODO(ts-error): fixme
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
  // Two kinds of query deliver rows before they finish, and both stay LOADING for their whole run:
  // a polling source reporting scan progress, and a streaming PPL job. Either way the spinner below
  // would replace the results area for the entire query and hide rows that are already renderable.
  const hasPartialResults = useSelector((state: RootState) => {
    const key = defaultPrepareQueryString(query);
    const tableStatus = selectQueryStatusMapByKey(state, key);
    const polling = !!tableStatus?.progress && !!state.results[key]?.hasResults;
    const streaming = Boolean(
      tableStatus?.streaming?.isPolling || state.queryEditor.overallQueryStatus.streaming?.isPolling
    );
    return polling || streaming;
  });

  if (dataset == null) {
    // Show auto-detect callout only for traces flavor
    if (flavorId === ExploreFlavor.Traces) {
      return (
        <CanvasPanel>
          <>
            <EuiSpacer size="xxl" />
            <TraceAutoDetectCallout />
          </>
        </CanvasPanel>
      );
    }

    // Show default empty state for other flavors
    return (
      <CanvasPanel>
        <>
          <EuiSpacer size="xxl" />
          <DiscoverNoIndexPatterns />
        </>
      </CanvasPanel>
    );
  }

  // The results panel's content for the query's status; null before any status applies.
  const renderResults = (): ReactNode => {
    if (status === QueryExecutionStatus.NO_RESULTS) {
      return (
        <DiscoverNoResults
          queryString={services?.data?.query?.queryString}
          query={services?.data?.query?.queryString?.getQuery()}
          savedQuery={services?.data?.query?.savedQueries}
          timeFieldName={dataset.timeFieldName}
        />
      );
    }

    if (status === QueryExecutionStatus.UNINITIALIZED) {
      return <DiscoverUninitialized onRefresh={onRefresh} />;
    }

    if (
      status === QueryExecutionStatus.LOADING &&
      dataTableStatus === QueryExecutionStatus.LOADING &&
      !hasPartialResults
    ) {
      return <LoadingSpinner />;
    }

    if (
      hasPartialResults ||
      dataTableStatus === QueryExecutionStatus.READY ||
      dataTableStatus === QueryExecutionStatus.ERROR ||
      status === QueryExecutionStatus.READY ||
      status === QueryExecutionStatus.ERROR
    ) {
      return (
        <>
          <DiscoverChartContainer />
          <ResizableVisControlAndTabs />
        </>
      );
    }
    return null;
  };

  const results = renderResults();
  // A registered source may replace the results area with an empty state of its own.
  const SourceEmptyState = query.dataset
    ? getSourceTypeRegistry().getForDataset(query.dataset).emptyState
    : undefined;
  if (!SourceEmptyState || !query.dataset) {
    return results === null ? null : <CanvasPanel>{results}</CanvasPanel>;
  }
  return (
    <CanvasPanel>
      <SourceEmptyState
        location="logsResults"
        dataset={query.dataset}
        data={services.data}
        flavor={flavorId}
        onRefresh={onRefresh}
      >
        {results}
      </SourceEmptyState>
    </CanvasPanel>
  );
};
