/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { useSelector as useNewStateSelector } from 'react-redux';
import { useSyncQueryStateWithUrl } from '../../../../data/public';
import { createOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { PLUGIN_ID } from '../../../common';
import { ExploreServices } from '../../types';
import { IndexPattern } from '../../application/legacy/discover/opensearch_dashboards_services';
import { useIndexPatternContext } from '../../application/components/index_pattern_context';
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

export interface TopNavProps {
  savedExplore?: SavedExplore;
  setHeaderActionMenu?: AppMountParameters['setHeaderActionMenu'];
}

export const TopNav = ({ setHeaderActionMenu = () => {}, savedExplore }: TopNavProps) => {
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

  const uiState = useNewStateSelector(selectUIState);
  const tabState = useNewStateSelector(selectTabState);
  const queryStatus = useNewStateSelector(selectQueryStatus);

  const tabDefinition = services.tabRegistry?.getTab?.(uiState.activeTabId);

  const [searchContext, setSearchContext] = useState<ExecutionContextSearch>({
    query: queryString.getQuery(),
    filters: filterManager.getFilters(),
    timeRange: timefilter.timefilter.getTime(),
  });

  // Get IndexPattern from centralized context
  const { indexPattern } = useIndexPatternContext();
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[] | undefined>(undefined);
  const [screenTitle, setScreenTitle] = useState<string>('');

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
      {
        indexPattern,
        tabState,
        flavorId,
        tabDefinition,
      },
      savedExplore
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
        onSelect: (dataset: any) => {
          if (!dataset) return;
        },
      }}
      useDefaultBehaviors
      setMenuMountPoint={setHeaderActionMenu}
      indexPatterns={indexPattern ? [indexPattern] : indexPatterns}
      savedQueryId={undefined}
      onSavedQueryIdChange={() => {}}
      groupActions={true}
      screenTitle={screenTitle}
      queryStatus={queryStatus}
      showQueryBar={false}
    />
  );
};
