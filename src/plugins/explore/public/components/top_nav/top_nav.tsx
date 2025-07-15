/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { useSelector as useNewStateSelector, useDispatch } from 'react-redux';
import { DataView } from '../../../../data/common';
import { useSyncQueryStateWithUrl } from '../../../../data/public';
import { createOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { PLUGIN_ID } from '../../../common';
import { ExploreServices } from '../../types';
import { useDatasetContext } from '../../application/context';
import { TopNavMenuItemRenderType } from '../../../../navigation/public';
import { ExecutionContextSearch } from '../../../../expressions/common';
import {
  selectTabState,
  selectUIState,
  selectQueryStatus,
} from '../../application/utils/state_management/selectors';
import { useFlavorId } from '../../helpers/use_flavor_id';
import { getTopNavLinks } from './top_nav_links';
import { SavedExplore } from '../../saved_explore';
import { setQueryState } from '../../application/utils/state_management/slices';
import { setDatasetActionCreator } from '../../application/utils/state_management/actions/set_dataset';
import { useClearEditors } from '../../application/hooks';

export interface TopNavProps {
  savedExplore?: SavedExplore;
  setHeaderActionMenu?: AppMountParameters['setHeaderActionMenu'];
}

export const TopNav = ({ setHeaderActionMenu = () => {}, savedExplore }: TopNavProps) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const clearEditors = useClearEditors();

  const flavorId = useFlavorId();
  const {
    data: {
      query: { filterManager, queryString, timefilter },
    },
    navigation: {
      ui: { TopNavMenu },
    },
    data,
    uiSettings,
    history,
  } = services;

  const uiState = useNewStateSelector(selectUIState);
  const tabState = useNewStateSelector(selectTabState);
  const queryStatus = useNewStateSelector(selectQueryStatus);

  const tabDefinition = services.tabRegistry?.getTab?.(uiState.activeTabId);

  const [searchContext, setSearchContext] = useState<ExecutionContextSearch>({
    query: queryString.getQuery(),
    filters: filterManager.getFilters(),
    timeRange: timefilter.timefilter.getTime(),
  });

  const { dataset } = useDatasetContext();
  const [datasets, setDatasets] = useState<DataView[] | undefined>(undefined);
  const [screenTitle, setScreenTitle] = useState<string>('');

  useEffect(() => {
    const subscription = data.query.state$.subscribe(({ state }) => {
      setSearchContext({
        query: state.query,
        timeRange: state.time,
        filters: state.filters,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [data.query.state$]);

  // Create osdUrlStateStorage from storage
  const osdUrlStateStorage = useMemo(() => {
    return createOsdUrlStateStorage({
      useHash: uiSettings.get('state:storeInSessionStorage', false),
      history: history(),
    });
  }, [uiSettings, history]);

  const { startSyncingQueryStateWithUrl } = useSyncQueryStateWithUrl(
    data.query,
    osdUrlStateStorage
  );

  const topNavLinks = useMemo(() => {
    return getTopNavLinks(
      services,
      startSyncingQueryStateWithUrl,
      searchContext,
      {
        dataset,
        tabState,
        flavorId,
        tabDefinition,
      },
      clearEditors,
      savedExplore
    );
  }, [
    savedExplore,
    dataset,
    searchContext,
    tabState,
    services,
    startSyncingQueryStateWithUrl,
    flavorId,
    tabDefinition,
    clearEditors,
  ]);

  useEffect(() => {
    let isMounted = true;
    const initializeDataset = async () => {
      await data.dataViews.ensureDefaultDataView();
      const defaultDataset = await data.dataViews.getDefault();
      if (!isMounted) return;

      setDatasets(defaultDataset ? [defaultDataset] : undefined);
    };

    initializeDataset();

    return () => {
      isMounted = false;
    };
  }, [data.dataViews, data.query]);

  useEffect(() => {
    // capitalize first letter
    const flavorPrefix = flavorId ? `${flavorId[0].toUpperCase()}${flavorId.slice(1)}/ ` : '';
    setScreenTitle(
      flavorPrefix +
        (savedExplore?.title ||
          i18n.translate('explore.discover.savedSearch.newTitle', {
            defaultMessage: 'New search',
          }))
    );
  }, [flavorId, savedExplore?.title]);

  const showDatePicker = useMemo(() => dataset?.isTimeBased() ?? false, [dataset]);

  const dispatch = useDispatch();

  const handleDatasetSelect = async (view: DataView) => {
    if (!view) return;

    const currentQuery = queryString.getQuery();

    const newDataset = data.dataViews.convertToDataset(view);
    dispatch(
      setQueryState({
        ...currentQuery,
        query: queryString.getInitialQueryByDataset(newDataset).query,
        dataset: newDataset,
      })
    );
    dispatch(setDatasetActionCreator(services, clearEditors));
  };

  return (
    <TopNavMenu
      appName={PLUGIN_ID}
      config={topNavLinks}
      data={data}
      showSearchBar={false}
      showDatePicker={showDatePicker && TopNavMenuItemRenderType.IN_PORTAL}
      showSaveQuery={false}
      showDatasetSelect={true}
      datasetSelectProps={{
        onSelect: handleDatasetSelect,
      }}
      useDefaultBehaviors
      setMenuMountPoint={setHeaderActionMenu}
      indexPatterns={dataset ? [dataset] : datasets}
      savedQueryId={undefined}
      onSavedQueryIdChange={() => {}}
      groupActions={true}
      screenTitle={screenTitle}
      queryStatus={queryStatus}
      showQueryBar={false}
    />
  );
};
