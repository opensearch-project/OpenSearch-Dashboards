/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { useSelector as useNewStateSelector, useDispatch } from 'react-redux';
import { useSyncQueryStateWithUrl } from '../../../../data/public';
import { createOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { TopNavMenuItemRenderType } from '../../../../navigation/public';
import { PLUGIN_ID } from '../../../common';
import { ExploreServices } from '../../types';
import { useDatasetContext } from '../../application/context';
import { ExecutionContextSearch } from '../../../../expressions/common';
import {
  selectTabState,
  selectUIState,
  selectQueryStatus,
} from '../../application/utils/state_management/selectors';
import { useFlavorId } from '../../helpers/use_flavor_id';
import { getTopNavLinks } from './top_nav_links';
import { getOpenButtonRun } from './top_nav_links/top_nav_open/top_nav_open';
import { getSaveButtonRun } from './top_nav_links/top_nav_save/top_nav_save';
import { SavedExplore } from '../../saved_explore';
import { setDateRange } from '../../application/utils/state_management/slices/query_editor/query_editor_slice';
import { useClearEditors, useEditorRef } from '../../application/hooks';
import { onEditorRunActionCreator } from '../../application/utils/state_management/actions/query_editor/on_editor_run/on_editor_run';
import { QueryExecutionButton } from './query_execution_button';
import { Query, TimeRange } from '../../../../data/common';

export interface TopNavProps {
  savedExplore?: SavedExplore;
  setHeaderActionMenu?: AppMountParameters['setHeaderActionMenu'];
}

export const TopNav = ({ setHeaderActionMenu = () => {}, savedExplore }: TopNavProps) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const clearEditors = useClearEditors();
  const editorRef = useEditorRef();
  const { keyboardShortcut } = services;

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
    scopedHistory,
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
      history: scopedHistory,
    });
  }, [uiSettings, scopedHistory]);

  const { startSyncingQueryStateWithUrl } = useSyncQueryStateWithUrl(
    data.query,
    osdUrlStateStorage
  );

  const dispatch = useDispatch();

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
        activeTabId: uiState.activeTabId,
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
    uiState.activeTabId,
  ]);

  useEffect(() => {
    // capitalize first letter
    const flavorPrefix = flavorId ? `${flavorId[0].toUpperCase()}${flavorId.slice(1)}/ ` : '';
    setScreenTitle(
      flavorPrefix +
        (savedExplore?.title ||
          i18n.translate('explore.discover.savedSearch.newTitle', {
            defaultMessage: 'Search',
          }))
    );
  }, [flavorId, savedExplore?.title]);

  const showDatePicker = useMemo(() => {
    return dataset?.isTimeBased() ?? false;
  }, [dataset]);

  // Custom onChange handler to track date range changes in Redux (mirrors SearchBar behavior)
  const handleQueryChange = useCallback(
    (queryAndDateRange: { dateRange: any; query?: Query }) => {
      if (queryAndDateRange.dateRange) {
        dispatch(setDateRange(queryAndDateRange.dateRange));
      }
    },
    [dispatch]
  );

  const handleQuerySubmit = useCallback(
    (payload?: { dateRange?: TimeRange; query?: Query }) => {
      if (payload?.dateRange) {
        dispatch(setDateRange(payload.dateRange));
      }

      const editorText = editorRef.current?.getValue() || '';
      dispatch(onEditorRunActionCreator(services, editorText));
    },
    [dispatch, services, editorRef]
  );

  const handleOpenShortcut = useCallback(() => {
    const openButtonRun = getOpenButtonRun(services);
    openButtonRun({} as HTMLElement);
  }, [services]);

  const handleSaveShortcut = useCallback(() => {
    if (savedExplore) {
      const saveButtonRun = getSaveButtonRun(
        services,
        startSyncingQueryStateWithUrl,
        searchContext,
        {
          dataset,
          tabState,
          flavorId,
          tabDefinition,
          activeTabId: uiState.activeTabId,
        },
        savedExplore
      );
      saveButtonRun({} as HTMLElement);
    }
  }, [
    services,
    startSyncingQueryStateWithUrl,
    searchContext,
    dataset,
    tabState,
    flavorId,
    tabDefinition,
    uiState.activeTabId,
    savedExplore,
  ]);

  keyboardShortcut?.useKeyboardShortcut({
    id: 'saved_search',
    pluginId: 'explore',
    name: i18n.translate('explore.topNav.savedSearchShortcut', {
      defaultMessage: 'Saved search',
    }),
    category: i18n.translate('explore.topNav.searchCategory', {
      defaultMessage: 'Search',
    }),
    keys: 'shift+o',
    execute: handleOpenShortcut,
  });

  keyboardShortcut?.useKeyboardShortcut({
    id: 'save_search',
    pluginId: 'explore',
    name: i18n.translate('explore.topNav.saveSearchShortcut', {
      defaultMessage: 'Save discover search',
    }),
    category: i18n.translate('explore.topNav.editingCategory', {
      defaultMessage: 'Data actions',
    }),
    keys: 'cmd+s',
    execute: handleSaveShortcut,
  });

  keyboardShortcut?.useKeyboardShortcut({
    id: 'refresh_query',
    pluginId: 'explore',
    name: i18n.translate('explore.topNav.refreshResultsShortcut', {
      defaultMessage: 'Refresh results',
    }),
    category: i18n.translate('explore.topNav.searchCategory', {
      defaultMessage: 'Search',
    }),
    keys: 'r',
    execute: () => handleQuerySubmit(),
  });

  const handleCustomButtonClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      handleQuerySubmit();
    },
    [handleQuerySubmit]
  );

  const customSubmitButton = useMemo(() => {
    return <QueryExecutionButton onClick={handleCustomButtonClick} />;
  }, [handleCustomButtonClick]);

  return (
    <TopNavMenu
      appName={PLUGIN_ID}
      config={topNavLinks}
      data={data}
      showSearchBar={TopNavMenuItemRenderType.IN_PLACE}
      showDatePicker={showDatePicker && TopNavMenuItemRenderType.IN_PORTAL}
      showSaveQuery={false}
      useDefaultBehaviors={false}
      setMenuMountPoint={setHeaderActionMenu}
      indexPatterns={dataset ? [dataset] : undefined}
      savedQueryId={undefined}
      onSavedQueryIdChange={() => {}}
      onQuerySubmit={handleQuerySubmit}
      onQueryChange={handleQueryChange}
      customSubmitButton={customSubmitButton}
      groupActions={true}
      screenTitle={screenTitle}
      queryStatus={queryStatus}
      showQueryBar={true}
      showQueryInput={false}
      showFilterBar={false}
    />
  );
};
