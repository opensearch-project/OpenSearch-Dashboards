import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public'
import { DashboardServices } from '../types'
import { getTopNavConfig } from '../top_nav/get_top_nav_config'
import { NullLiteral } from 'typescript';

interface DashboardTopNavProps {
  isChromeVisible?: boolean;
}

/*
export function getTopNavConfig(
  dashboardMode: ViewMode,
  actions: { [key: string]: NavAction },
  hideWriteControls: boolean,
  onAppLeave?: AppMountParameters['onAppLeave']
) 
*/

const TopNav = ({
  isChromeVisible
}: DashboardTopNavProps) => {
    const { services } = useOpenSearchDashboards<DashboardServices>();
    const { TopNavMenu } = services.navigation.ui;
    const { setHeaderActionMenu, dashboardCapabilities } = services;


      const isFullScreenMode = dashboardStateManager.getFullScreenMode();
      const screenTitle = dashboardStateManager.getTitle();
      const showTopNavMenu = shouldShowNavBarComponent(forceShowTopNavMenu);
      const showQueryInput = shouldShowNavBarComponent(forceShowQueryInput);
      const showDatePicker = shouldShowNavBarComponent(forceShowDatePicker);
      const showQueryBar = showQueryInput || showDatePicker;
      const showFilterBar = shouldShowFilterBar(forceHideFilterBar);
      const showSearchBar = showQueryBar || showFilterBar;



    const config = useMemo(() => {
        return getTopNavConfig({

        })
    })

    return isChromeVisible ? (
      <TopNavMenu 
        appName={'dashboard'}
        config={showTopNavMenu ? $scope.topNavMenu : undefined}
        className={isFullScreenMode ? 'osdTopNavMenu-isFullScreen' : undefined}
        screenTitle
        showTopNavMenu
        showSearchBar
        showQueryBar
        showQueryInput
        showDatePicker
        showFilterBar
        indexPatterns: $scope.indexPatterns
        showSaveQuery: $scope.showSaveQuery
        savedQuery: $scope.savedQuery
        onSavedQueryIdChange
        savedQueryId: dashboardStateManager.getSavedQueryId()
        useDefaultBehaviors: true
        onQuerySubmit: $scope.handleRefresh
      />
    ): null;
}