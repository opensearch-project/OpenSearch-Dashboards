/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { useSelector as useNewStateSelector } from 'react-redux';
import { QueryStatus, useSyncQueryStateWithUrl } from '../../../../../../../../data/public';
import { createOsdUrlStateStorage } from '../../../../../../../../opensearch_dashboards_utils/public';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import { PLUGIN_ID } from '../../../../../../../common';
import { ExploreServices } from '../../../../../../types';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { useDispatch, useSelector } from '../../utils/state_management';
import { setSavedQuery } from '../../../../../utils/state_management/slices';
import { useIndexPatternContext } from '../../../../../components/index_pattern_context';

import './discover_canvas.scss';
import { TopNavMenuItemRenderType } from '../../../../../../../../navigation/public';
import { ResultStatus } from '../utils';
import { ExecutionContextSearch } from '../../../../../../../../expressions/common/';
import { saveStateToSavedObject } from '../../../../../../saved_explore/transforms';
import {
  selectTabState,
  selectUIState,
  selectStatus,
  selectSavedQuery,
} from '../../../../../utils/state_management/selectors';
import { useFlavorId } from '../../../../../../helpers/use_flavor_id';
import { useSavedExplore } from '../../../../../utils/hooks/use_saved_explore';
import { getTopNavLinks } from '../../../../../../components/top_nav/top_nav_links';
import { useCurrentExploreId } from '../../../../../utils/hooks/use_current_explore_id';

export interface TopNavProps {
  setHeaderActionMenu?: AppMountParameters['setHeaderActionMenu'];
}

export const TopNav = ({ setHeaderActionMenu = () => {} }: TopNavProps) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
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
  const dispatch = useDispatch();
  const savedExploreId = useCurrentExploreId();

  const uiState = useNewStateSelector(selectUIState);
  const tabState = useNewStateSelector(selectTabState);

  const tabDefinition = services.tabRegistry?.getTab?.(uiState.activeTabId);

  const savedQueryId = useSelector(selectSavedQuery);
  const isLoading = useSelector(selectStatus) === ResultStatus.LOADING;
  const { savedExplore } = useSavedExplore(savedExploreId);
  const [searchContext, setSearchContext] = useState<ExecutionContextSearch>({
    query: queryString.getQuery(),
    filters: filterManager.getFilters(),
    timeRange: timefilter.timefilter.getTime(),
  });

  // Get IndexPattern from centralized context
  const { indexPattern } = useIndexPatternContext();
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[] | undefined>(undefined);
  const [screenTitle, setScreenTitle] = useState<string>('');
  const [queryStatus, setQueryStatus] = useState<QueryStatus>({ status: ResultStatus.READY });

  useEffect(() => {
    const subscription = services.data.query.state$.subscribe(({ state }) => {
      setSearchContext({
        query: state.query,
        timeRange: state.time,
        filters: state.filters,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [services.data.query.state$]);

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
      savedExplore
        ? saveStateToSavedObject(
            savedExplore,
            flavorId ?? 'logs',
            tabDefinition!,
            tabState,
            indexPattern
          )
        : undefined
    );
  }, [
    savedExplore,
    indexPattern,
    searchContext,
    tabState,
    services,
    startSyncingQueryStateWithUrl,
    flavorId,
    tabDefinition,
  ]);

  // Replace data$ subscription with Redux state-based queryStatus
  useEffect(() => {
    const status = isLoading ? ResultStatus.LOADING : ResultStatus.READY;
    setQueryStatus({ status });
  }, [isLoading]);

  useEffect(() => {
    let isMounted = true;
    const initializeDataset = async () => {
      await data.indexPatterns.ensureDefaultIndexPattern();
      const defaultIndexPattern = await data.indexPatterns.getDefault();
      if (!isMounted) return;

      setIndexPatterns(defaultIndexPattern ? [defaultIndexPattern] : undefined);
    };

    initializeDataset();

    return () => {
      isMounted = false;
    };
  }, [data.indexPatterns, data.query]);

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

  const showDatePicker = useMemo(() => indexPattern?.isTimeBased() ?? false, [indexPattern]);

  const updateSavedQueryId = (newSavedQueryId: string | undefined) => {
    dispatch(setSavedQuery(newSavedQueryId));
  };

  return (
    <TopNavMenu
      appName={PLUGIN_ID}
      config={topNavLinks}
      data={data}
      showSearchBar={false}
      showDatePicker={showDatePicker && TopNavMenuItemRenderType.IN_PORTAL}
      showSaveQuery={true}
      useDefaultBehaviors
      setMenuMountPoint={setHeaderActionMenu}
      indexPatterns={indexPattern ? [indexPattern] : indexPatterns}
      savedQueryId={savedQueryId}
      onSavedQueryIdChange={updateSavedQueryId}
      groupActions={true}
      screenTitle={screenTitle}
      queryStatus={queryStatus}
      showQueryBar={false}
    />
  );
};
