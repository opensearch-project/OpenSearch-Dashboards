/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
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

// eslint-disable-next-line import/no-default-export
export default function DiscoverCanvas({ setHeaderActionMenu, history }: ViewProps) {
  const { data$, refetch$, indexPattern } = useDiscoverContext();

  const [fetchState, setFetchState] = useState<SearchData>({
    status: data$.getValue().status,
    hits: 0,
    bucketInterval: {},
  });

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
