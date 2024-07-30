/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  EuiButtonIcon,
  EuiContextMenu,
  EuiPanel,
  EuiPopover,
  EuiCompressedSwitch,
} from '@elastic/eui';
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
import {
  DEFAULT_COLUMNS_SETTING,
  MODIFY_COLUMNS_ON_SWITCH,
  QUERY_ENHANCEMENT_ENABLED_SETTING,
} from '../../../../common';
import { OpenSearchSearchHit } from '../../../application/doc_views/doc_views_types';
import { buildColumns } from '../../utils/columns';
import './discover_canvas.scss';
import { getNewDiscoverSetting, setNewDiscoverSetting } from '../../components/utils/local_storage';

// eslint-disable-next-line import/no-default-export
export default function DiscoverCanvas({ setHeaderActionMenu, history, optionalRef }: ViewProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { data$, refetch$, indexPattern } = useDiscoverContext();
  const {
    services: { uiSettings, storage, capabilities },
  } = useOpenSearchDashboards<DiscoverViewServices>();
  const { columns } = useSelector((state) => {
    const stateColumns = state.discover.columns;

    // check if stateColumns is not undefined, otherwise use buildColumns
    return {
      columns: stateColumns !== undefined ? stateColumns : buildColumns([]),
    };
  });
  const isEnhancementsEnabled = uiSettings.get(QUERY_ENHANCEMENT_ENABLED_SETTING);
  const filteredColumns = filterColumns(
    columns,
    indexPattern,
    uiSettings.get(DEFAULT_COLUMNS_SETTING),
    uiSettings.get(MODIFY_COLUMNS_ON_SWITCH)
  );
  const dispatch = useDispatch();
  const prevIndexPattern = useRef(indexPattern);

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
      if (next.status === ResultStatus.LOADING) return;

      let shouldUpdateState = false;

      if (next.status !== fetchState.status) shouldUpdateState = true;
      if (next.hits && next.hits !== fetchState.hits) shouldUpdateState = true;
      if (next.bucketInterval && next.bucketInterval !== fetchState.bucketInterval)
        shouldUpdateState = true;
      if (next.chartData && next.chartData !== fetchState.chartData) shouldUpdateState = true;
      if (next.rows && next.rows !== fetchState.rows) {
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
    if (indexPattern !== prevIndexPattern.current) {
      dispatch(setColumns({ columns: filteredColumns }));
      prevIndexPattern.current = indexPattern;
    }
  }, [dispatch, filteredColumns, indexPattern]);

  const timeField = indexPattern?.timeFieldName ? indexPattern.timeFieldName : undefined;
  const scrollToTop = () => {
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  };
  const showSaveQuery = !!capabilities.discover?.saveQuery;

  return (
    <EuiPanel
      panelRef={panelRef}
      hasBorder={false}
      hasShadow={false}
      color="transparent"
      paddingSize="none"
      className="dscCanvas"
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

      {fetchState.status === ResultStatus.NO_RESULTS && (
        <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} />
      )}
      {fetchState.status === ResultStatus.UNINITIALIZED && (
        <DiscoverUninitialized onRefresh={() => refetch$.next()} />
      )}
      {fetchState.status === ResultStatus.LOADING && <LoadingSpinner />}
      {fetchState.status === ResultStatus.READY && isEnhancementsEnabled && (
        <>
          <MemoizedDiscoverChartContainer {...fetchState} />
          <MemoizedDiscoverTable rows={rows} scrollToTop={scrollToTop} />
        </>
      )}
      {fetchState.status === ResultStatus.READY && !isEnhancementsEnabled && (
        <EuiPanel hasShadow={false} paddingSize="none" className="dscCanvas_results">
          <MemoizedDiscoverChartContainer {...fetchState} />
          <MemoizedDiscoverTable rows={rows} scrollToTop={scrollToTop} />
        </EuiPanel>
      )}
    </EuiPanel>
  );
}

const MemoizedDiscoverTable = React.memo(DiscoverTable);
const MemoizedDiscoverChartContainer = React.memo(DiscoverChartContainer);
