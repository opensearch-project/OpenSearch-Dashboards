/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { EuiPanel, EuiSpacer } from '@elastic/eui';
import { TopNav } from './top_nav';
import { ViewProps } from '../../../../../data_explorer/public';
import { DiscoverTable } from './discover_table';
import { DiscoverChartContainer } from './discover_chart_container';
import { useDiscoverContext } from '../context';
import { ResultStatus, SearchData } from '../utils/use_search';
import { DiscoverNoResults } from '../../components/no_results/no_results';
import { DiscoverNoIndexPatterns } from '../../components/no_index_patterns/no_index_patterns';
import { DiscoverUninitialized } from '../../components/uninitialized/uninitialized';
import { LoadingSpinner } from '../../components/loading_spinner/loading_spinner';
import { DiscoverResultsActionBar } from '../../components/results_action_bar/results_action_bar';
import { DiscoverViewServices } from '../../../build_services';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { QUERY_ENHANCEMENT_ENABLED_SETTING } from '../../../../common';
import { OpenSearchSearchHit } from '../../../application/doc_views/doc_views_types';
import './discover_canvas.scss';
import { HeaderVariant } from '../../../../../../core/public';

// eslint-disable-next-line import/no-default-export
export default function DiscoverCanvas({ setHeaderActionMenu, optionalRef }: ViewProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { data$, refetch$, indexPattern, savedSearch } = useDiscoverContext();
  const {
    services: {
      uiSettings,
      capabilities,
      chrome: { setHeaderVariant },
      data,
      core,
    },
  } = useOpenSearchDashboards<DiscoverViewServices>();
  const isEnhancementsEnabled = uiSettings.get(QUERY_ENHANCEMENT_ENABLED_SETTING);

  const [fetchState, setFetchState] = useState<SearchData>({
    status: data$.getValue().status,
    hits: 0,
    bucketInterval: {},
  });

  const onQuerySubmit = useCallback(
    (payload, isUpdate) => {
      if (isUpdate === false) {
        refetch$.next();
      }
    },
    [refetch$]
  );
  const [rows, setRows] = useState<OpenSearchSearchHit[] | undefined>(undefined);

  useEffect(() => {
    const subscription = data$.subscribe((next) => {
      let shouldUpdateState = false;

      if (next.status !== fetchState.status) shouldUpdateState = true;
      if (next.hits && next.hits !== fetchState.hits) shouldUpdateState = true;
      if (next.bucketInterval && next.bucketInterval !== fetchState.bucketInterval)
        shouldUpdateState = true;
      if (next.chartData && next.chartData !== fetchState.chartData) shouldUpdateState = true;
      if (next.fieldCounts && next.fieldCounts !== fetchState.fieldCounts) shouldUpdateState = true;
      // we still want to show rows from the previous query while current query is loading or the current query results in error
      if (
        next.status !== ResultStatus.LOADING &&
        next.status !== ResultStatus.ERROR &&
        next.rows &&
        next.rows !== fetchState.rows
      ) {
        shouldUpdateState = true;
        setRows(next.rows);
      }

      // Update the state if any condition is met.
      if (shouldUpdateState) {
        setFetchState({ ...fetchState, ...next });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [data$, fetchState]);

  useEffect(() => {
    setHeaderVariant?.(HeaderVariant.APPLICATION);
    return () => {
      setHeaderVariant?.();
    };
  }, [setHeaderVariant]);

  const timeField = indexPattern?.timeFieldName ? indexPattern.timeFieldName : undefined;
  const scrollToTop = () => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  };
  const showSaveQuery = !!capabilities.discover?.saveQuery;

  const discoverResultsActionBar = (
    <DiscoverResultsActionBar
      hits={fetchState.hits}
      showResetButton={!!savedSearch?.id}
      resetQuery={() => {
        core.application.navigateToApp('discover', { path: `#/view/${savedSearch?.id}` });
      }}
      rows={rows}
      indexPattern={indexPattern}
    />
  );

  return (
    <EuiPanel
      panelRef={panelRef}
      hasBorder={true}
      hasShadow={false}
      paddingSize="s"
      className="dscCanvas"
      data-test-subj="dscCanvas"
      borderRadius="l"
    >
      <TopNav
        isEnhancementsEnabled={isEnhancementsEnabled}
        opts={{
          setHeaderActionMenu,
          onQuerySubmit,
          optionalRef,
        }}
        showSaveQuery={showSaveQuery}
      />

      {indexPattern ? (
        <>
          {fetchState.status === ResultStatus.NO_RESULTS && (
            <DiscoverNoResults
              queryString={data.query.queryString}
              query={data.query.queryString.getQuery()}
              savedQuery={data.query.savedQueries}
              timeFieldName={timeField}
            />
          )}
          {fetchState.status === ResultStatus.UNINITIALIZED && (
            <DiscoverUninitialized onRefresh={() => refetch$.next()} />
          )}
          {fetchState.status === ResultStatus.LOADING && !rows?.length && <LoadingSpinner />}
          {fetchState.status === ResultStatus.ERROR && !rows?.length && (
            <DiscoverUninitialized onRefresh={() => refetch$.next()} />
          )}
          {(fetchState.status === ResultStatus.READY ||
            (fetchState.status === ResultStatus.LOADING && !!rows?.length) ||
            (fetchState.status === ResultStatus.ERROR && !!rows?.length)) &&
            (isEnhancementsEnabled ? (
              <>
                <MemoizedDiscoverChartContainer {...fetchState} />
                {discoverResultsActionBar}
                <MemoizedDiscoverTable
                  rows={rows}
                  scrollToTop={scrollToTop}
                  fetchState={fetchState}
                />
              </>
            ) : (
              <EuiPanel
                hasShadow={false}
                paddingSize="none"
                className="dscCanvas_results"
                data-test-subj="dscCanvasResults"
              >
                <MemoizedDiscoverChartContainer {...fetchState} />
                {discoverResultsActionBar}
                <MemoizedDiscoverTable
                  rows={rows}
                  scrollToTop={scrollToTop}
                  fetchState={fetchState}
                />
              </EuiPanel>
            ))}
        </>
      ) : (
        <>
          <EuiSpacer size="xxl" />
          <DiscoverNoIndexPatterns />
        </>
      )}
    </EuiPanel>
  );
}

const MemoizedDiscoverTable = React.memo(DiscoverTable);
const MemoizedDiscoverChartContainer = React.memo(DiscoverChartContainer);
