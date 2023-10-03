/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel } from '@elastic/eui';
import { TopNav } from './top_nav';
import { ViewProps } from '../../../../../data_explorer/public';
import { DiscoverTable } from './discover_table';
import { DiscoverChartContainer } from './discover_chart_container';
import { useDiscoverContext } from '../context';
import { ResultStatus, SearchData } from '../utils/use_search';
import { DiscoverNoResults } from '../../components/no_results/no_results';
import { DiscoverUninitialized } from '../../components/uninitialized/uninitialized';
import { LoadingSpinner } from '../../components/loading_spinner/loading_spinner';
import { setColumns, useDispatch, useSelector } from '../../utils/state_management';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { filterColumns } from '../utils/filter_columns';
import { DEFAULT_COLUMNS_SETTING } from '../../../../common';
import './discover_canvas.scss';
// eslint-disable-next-line import/no-default-export
export default function DiscoverCanvas({ setHeaderActionMenu, history }: ViewProps) {
  const { data$, refetch$, indexPattern } = useDiscoverContext();
  const {
    services: { uiSettings },
  } = useOpenSearchDashboards<DiscoverViewServices>();
  const { columns } = useSelector((state) => state.discover);
  const filteredColumns = filterColumns(
    columns,
    indexPattern,
    uiSettings.get(DEFAULT_COLUMNS_SETTING)
  );
  const dispatch = useDispatch();
  const prevIndexPattern = useRef(indexPattern);

  const [fetchState, setFetchState] = useState<SearchData>({
    status: data$.getValue().status,
    hits: 0,
    bucketInterval: {},
  });

  const { status } = fetchState;
  const onQuerySubmit = useCallback(
    (payload, isUpdate) => {
      if (isUpdate === false) {
        refetch$.next();
      }
    },
    [refetch$]
  );

  useEffect(() => {
    const subscription = data$.subscribe((next) => {
      if (
        next.status !== fetchState.status ||
        (next.hits && next.hits !== fetchState.hits) ||
        (next.bucketInterval && next.bucketInterval !== fetchState.bucketInterval) ||
        (next.chartData && next.chartData !== fetchState.chartData)
      ) {
        setFetchState({ ...fetchState, ...next });
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [data$, fetchState]);

  useEffect(() => {
    if (indexPattern !== prevIndexPattern.current) {
      dispatch(setColumns({ columns: filteredColumns }));
      prevIndexPattern.current = indexPattern;
    }
  }, [dispatch, filteredColumns, indexPattern]);

  const timeField = indexPattern?.timeFieldName ? indexPattern.timeFieldName : undefined;

  return (
    <EuiFlexGroup direction="column" gutterSize="none" className="dscCanvas">
      <EuiFlexItem grow={false}>
        <TopNav
          opts={{
            setHeaderActionMenu,
            onQuerySubmit,
          }}
        />
      </EuiFlexItem>
      {status === ResultStatus.NO_RESULTS && (
        <EuiFlexItem>
          <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} />
        </EuiFlexItem>
      )}
      {status === ResultStatus.UNINITIALIZED && (
        <DiscoverUninitialized onRefresh={() => refetch$.next()} />
      )}
      {status === ResultStatus.LOADING && <LoadingSpinner />}
      {status === ResultStatus.READY && (
        <>
          <EuiFlexItem grow={false}>
            <EuiPanel hasBorder={false} hasShadow={false} color="transparent" paddingSize="s">
              <EuiPanel>
                <DiscoverChartContainer {...fetchState} />
              </EuiPanel>
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem>
            <DiscoverTable history={history} />
          </EuiFlexItem>
        </>
      )}
    </EuiFlexGroup>
  );
}
