/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { useSelector as useNewStateSelector } from 'react-redux';
import { Query, TimeRange } from '../../../../../../../../data/common';
import { QueryStatus, useSyncQueryStateWithUrl } from '../../../../../../../../data/public';
import { createOsdUrlStateStorage } from '../../../../../../../../opensearch_dashboards_utils/public';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import { PLUGIN_ID } from '../../../../../../../common';
import { ExploreServices } from '../../../../../../types';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { getTopNavLinks } from '../../components/top_nav/get_top_nav_links';
import { useDispatch, useSelector } from '../../utils/state_management';
import { setSavedQuery } from '../../../../../utils/state_management/slices/legacy_slice';
import { useIndexPatternContext } from '../../../../../components/index_pattern_context';

import './discover_canvas.scss';
import { TopNavMenuItemRenderType } from '../../../../../../../../navigation/public';
import { ResultStatus } from '../utils';
import { selectSavedQuery } from '../../../../../utils/state_management/selectors';
import { ExecutionContextSearch } from '../../../../../../../../expressions/common/';
import { saveStateToSavedObject } from '../../../../../../saved_explore/transforms';
import { selectUIState } from '../../../../../utils/state_management/selectors';
import { useFlavorId } from '../../../../../../helpers/use_flavor_id';
import { useSavedExplore } from '../../../../../utils/hooks/use_saved_explore';
import { getSavedExploreIdFromUrl } from '../../../../../utils/state_management/utils/url';

export interface TopNavProps {
  opts: {
    setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
    onQuerySubmit: (payload: { dateRange: TimeRange; query?: Query }, isUpdate?: boolean) => void;
  };
  showSaveQuery: boolean;
}

export const TopNav = ({ opts, showSaveQuery }: TopNavProps) => {
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
  const savedExploreIdFromUrl = getSavedExploreIdFromUrl();

  const uiState = useNewStateSelector(selectUIState);

  const savedQueryId = useSelector(selectSavedQuery);
  const isLoading = useSelector((state: any) => state.ui.status === ResultStatus.LOADING);
  const { savedExplore } = useSavedExplore(savedExploreIdFromUrl);
  const [searchContext, setSearchContext] = useState<ExecutionContextSearch>({
    query: queryString.getQuery(),
    filters: filterManager.getFilters(),
    timeRange: timefilter.timefilter.getTime(),
  });

  // Replace savedSearch - use legacy state
  // const savedSearch = useMemo(() => {
  //   return legacyState?.savedSearch;
  // }, [legacyState?.savedSearch]);

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
  const showActionsInGroup = uiSettings.get('home:useNewHomePage');
  // const showActionsInGroup = false; // Use portal approach to display actions in nav bar

  const topNavLinks = useMemo(() => {
    return getTopNavLinks(
      services,
      startSyncingQueryStateWithUrl,
      searchContext,
      indexPattern,
      savedExplore ? saveStateToSavedObject(savedExplore, uiState, indexPattern) : undefined
    );
  }, [savedExplore, indexPattern, searchContext, uiState, services, startSyncingQueryStateWithUrl]);

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
      showSaveQuery={showSaveQuery}
      useDefaultBehaviors
      setMenuMountPoint={opts.setHeaderActionMenu}
      indexPatterns={indexPattern ? [indexPattern] : indexPatterns}
      onQuerySubmit={opts.onQuerySubmit}
      savedQueryId={savedQueryId}
      onSavedQueryIdChange={updateSavedQueryId}
      groupActions={showActionsInGroup}
      screenTitle={screenTitle}
      queryStatus={queryStatus}
      showQueryBar={false}
    />
  );
};
