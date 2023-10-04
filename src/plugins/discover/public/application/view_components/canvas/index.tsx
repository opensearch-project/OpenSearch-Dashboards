/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiCallOut, EuiLink } from '@elastic/eui';
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

const KEY_SHOW_NOTICE = 'discover:deprecation-notice:show';

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

  const [isCallOutVisible, setIsCallOutVisible] = useState(
    localStorage.getItem(KEY_SHOW_NOTICE) !== 'false'
  );
  const closeCallOut = () => {
    localStorage.setItem(KEY_SHOW_NOTICE, 'false');
    setIsCallOutVisible(false);
  };

  let callOut;

  if (isCallOutVisible) {
    callOut = (
      <EuiFlexItem grow={false}>
        <EuiPanel hasBorder={false} hasShadow={false} color="transparent" paddingSize="s">
          <EuiCallOut
            title="You're viewing Discover 2.0. The old Discover app will be retired in OpenSearch version 2.11. To switch back to the old version, turn off the New Discover toggle."
            iconType="alert"
            dismissible
            onDismiss={closeCallOut}
          >
            <p>
              To provide feedback,{' '}
              <EuiLink href="https://github.com/opensearch-project/OpenSearch-Dashboards/issues">
                open an issue
              </EuiLink>
              .
            </p>
          </EuiCallOut>
        </EuiPanel>
      </EuiFlexItem>
    );
  }

  const { status } = fetchState;

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
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
        <TopNav
          opts={{
            setHeaderActionMenu,
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
          {callOut}
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
