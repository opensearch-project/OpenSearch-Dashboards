/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { EuiPanel } from '@elastic/eui';
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
import { HeaderVariant } from '../../../../../../core/public';
import { Query } from '../../../../../../../src/plugins/data/common/types';
import { setIndexPattern, setSelectedDataset } from '../../../../../data_explorer/public';
import { NoIndexPatternsPanel, AdvancedSelector } from '../../../../../data/public';
import { Dataset } from '../../../../../data/common';
import { toMountPoint } from '../../../../../opensearch_dashboards_react/public';

// eslint-disable-next-line import/no-default-export
export default function DiscoverCanvas({ setHeaderActionMenu, history, optionalRef }: ViewProps) {
  const { indexPattern: currentIndexPattern, selectedDataset } = useSelector(
    (state) => state.metadata
  );
  const [loadedIndexPattern, setLoadedIndexPattern] = useState<any>(selectedDataset?.id);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data$, refetch$, indexPattern } = useDiscoverContext();
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const {
    uiSettings,
    capabilities,
    chrome: { setHeaderVariant },
    data,
    overlays,
  } = services;
  const datasetService = data.query.queryString.getDatasetService();
  const savedQuery = data.query.savedQueries;
  const languageService = data.query.queryString.getLanguageService();
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
  const [query, setQuery] = useState<Query>();

  const [fetchState, setFetchState] = useState<SearchData>({
    status: data$.getValue().status,
    hits: 0,
    bucketInterval: {},
  });

  const onQuerySubmit = useCallback(
    (payload, isUpdate) => {
      if (payload?.query) {
        setQuery(payload?.query);
      }
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

  const handleDatasetChange = (dataset: Dataset) => {
    dispatch(setSelectedDataset(dataset));

    // Update query and other necessary state
    const queryString = data.query.queryString;
    const initialQuery = queryString.getInitialQueryByDataset(dataset);
    queryString.setQuery(initialQuery);
    queryString.getDatasetService().addRecentDataset(dataset);
  };

  const handleOpenDataSelector = () => {
    const overlay = overlays?.openModal(
      toMountPoint(
        <AdvancedSelector
          services={services}
          onSelect={(dataset?: Dataset) => {
            overlay?.close();
            if (dataset) {
              handleDatasetChange(dataset);
            }
          }}
          onCancel={() => overlay?.close()}
          selectedDataset={undefined}
          setSelectedDataset={setSelectedDataset}
          setIndexPattern={setIndexPattern}
          dispatch={dispatch}
        />
      ),
      {
        maxWidth: false,
        className: 'datasetSelector__advancedModal',
      }
    );
  };

  const hasNoDataset = !currentIndexPattern && !loadedIndexPattern && isEnhancementsEnabled;

  return (
    <EuiPanel
      panelRef={panelRef}
      hasBorder={hasNoDataset ? false : true}
      color={hasNoDataset ? 'transparent' : 'plain'}
      hasShadow={false}
      paddingSize="s"
      className="dscCanvas"
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
        useNoIndexPatternsTopNav={hasNoDataset}
      />
      {hasNoDataset ? (
        <NoIndexPatternsPanel onOpenDataSelector={handleOpenDataSelector} />
      ) : (
        <>
          {fetchState.status === ResultStatus.NO_RESULTS && (
            <DiscoverNoResults
              datasetService={datasetService}
              savedQuery={savedQuery}
              languageService={languageService}
              query={query}
              timeFieldName={timeField}
              queryLanguage={''}
            />
          )}
          {fetchState.status === ResultStatus.ERROR && (
            <DiscoverNoResults
              datasetService={datasetService}
              savedQuery={savedQuery}
              languageService={languageService}
              query={query}
              timeFieldName={timeField}
              queryLanguage={''}
            />
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
        </>
      )}
    </EuiPanel>
  );
}

const MemoizedDiscoverTable = React.memo(DiscoverTable);
const MemoizedDiscoverChartContainer = React.memo(DiscoverChartContainer);
