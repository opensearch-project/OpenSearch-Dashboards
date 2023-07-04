/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, useState, useEffect } from 'react';
import { Filter, IndexPattern } from 'src/plugins/data/public';
import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getTopNavConfig } from '../top_nav/get_top_nav_config';
import { DashboardAppStateContainer, DashboardAppState, DashboardServices } from '../../types';
import { getNavActions } from '../utils/get_nav_actions';
import { DashboardContainer } from '../embeddable';
import { Dashboard } from '../../dashboard';

interface DashboardTopNavProps {
  isChromeVisible: boolean;
  savedDashboardInstance: any;
  stateContainer: DashboardAppStateContainer;
  dashboard: Dashboard;
  currentAppState: DashboardAppState;
  isEmbeddableRendered: boolean;
  indexPatterns: IndexPattern[];
  dashboardContainer?: DashboardContainer;
}

export enum UrlParams {
  SHOW_TOP_MENU = 'show-top-menu',
  SHOW_QUERY_INPUT = 'show-query-input',
  SHOW_TIME_FILTER = 'show-time-filter',
  SHOW_FILTER_BAR = 'show-filter-bar',
  HIDE_FILTER_BAR = 'hide-filter-bar',
}

const TopNav = ({
  isChromeVisible,
  savedDashboardInstance,
  stateContainer,
  dashboard,
  currentAppState,
  isEmbeddableRendered,
  dashboardContainer,
  indexPatterns,
}: DashboardTopNavProps) => {
  const [topNavMenu, setTopNavMenu] = useState<any>();
  const [isFullScreenMode, setIsFullScreenMode] = useState<any>();

  const { services } = useOpenSearchDashboards<DashboardServices>();
  const { TopNavMenu } = services.navigation.ui;
  const { dashboardConfig, setHeaderActionMenu } = services;

  const location = useLocation();
  const queryParameters = new URLSearchParams(location.search);

  const handleRefresh = useCallback(
    (_payload: any, isUpdate?: boolean) => {
      if (!isUpdate && dashboardContainer) {
        dashboardContainer.reload();
      }
    },
    [dashboardContainer]
  );

  const isEmbeddedExternally = Boolean(queryParameters.get('embed'));

  // url param rules should only apply when embedded (e.g. url?embed=true)
  const shouldForceDisplay = (param: string): boolean =>
    isEmbeddedExternally && Boolean(queryParameters.get(param));

  // When in full screen mode, none of the nav bar components can be forced show
  // Only in embed mode, the nav bar components can be forced show base on URL params
  const shouldShowNavBarComponent = (forceShow: boolean): boolean =>
    (forceShow || isChromeVisible) && !currentAppState?.fullScreenMode;

  useEffect(() => {
    if (isEmbeddableRendered) {
      const navActions = getNavActions(
        stateContainer,
        savedDashboardInstance,
        services,
        dashboard,
        dashboardContainer
      );
      setTopNavMenu(
        getTopNavConfig(
          currentAppState?.viewMode,
          navActions,
          dashboardConfig.getHideWriteControls()
        )
      );
    }
  }, [
    currentAppState,
    services,
    dashboardConfig,
    dashboardContainer,
    savedDashboardInstance,
    stateContainer,
    isEmbeddableRendered,
    dashboard,
  ]);

  useEffect(() => {
    setIsFullScreenMode(currentAppState?.fullScreenMode);
  }, [currentAppState, services]);

  const shouldShowFilterBar = (forceHide: boolean): boolean =>
    !forceHide && (currentAppState.filters!.length > 0 || !currentAppState?.fullScreenMode);

  const forceShowTopNavMenu = shouldForceDisplay(UrlParams.SHOW_TOP_MENU);
  const forceShowQueryInput = shouldForceDisplay(UrlParams.SHOW_QUERY_INPUT);
  const forceShowDatePicker = shouldForceDisplay(UrlParams.SHOW_TIME_FILTER);
  const forceHideFilterBar = shouldForceDisplay(UrlParams.HIDE_FILTER_BAR);
  const showTopNavMenu = shouldShowNavBarComponent(forceShowTopNavMenu);
  const showQueryInput = shouldShowNavBarComponent(forceShowQueryInput);
  const showDatePicker = shouldShowNavBarComponent(forceShowDatePicker);
  const showQueryBar = showQueryInput || showDatePicker;
  const showFilterBar = shouldShowFilterBar(forceHideFilterBar);
  const showSearchBar = showQueryBar || showFilterBar;

  return (
    <TopNavMenu
      appName={'dashboard'}
      config={showTopNavMenu ? topNavMenu : undefined}
      className={isFullScreenMode ? 'osdTopNavMenu-isFullScreen' : undefined}
      screenTitle={currentAppState.title}
      showSearchBar={showSearchBar}
      showQueryBar={showQueryBar}
      showQueryInput={showQueryInput}
      showDatePicker={showDatePicker}
      showFilterBar={showFilterBar}
      useDefaultBehaviors={true}
      indexPatterns={indexPatterns}
      showSaveQuery={services.dashboardCapabilities.saveQuery as boolean}
      savedQuery={undefined}
      onSavedQueryIdChange={(savedQueryId?: string) => {
        stateContainer.transitions.set('savedQuery', savedQueryId);
      }}
      savedQueryId={currentAppState?.savedQuery}
      onQuerySubmit={handleRefresh}
      setMenuMountPoint={isEmbeddedExternally ? undefined : setHeaderActionMenu}
    />
  );
};

export const DashboardTopNav = memo(TopNav);
