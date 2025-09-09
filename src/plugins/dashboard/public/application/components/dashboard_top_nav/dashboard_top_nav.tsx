/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { memo, useState, useEffect, useCallback } from 'react';
import { IndexPattern } from 'src/plugins/data/public';
import { useLocation } from 'react-router-dom';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { getTopNavConfig, getTopNavRightConfig, getTopNavLegacyConfig } from './top_nav';
import { DashboardAppStateContainer, DashboardAppState, DashboardServices } from '../../../types';
import { getNavActions } from '../../utils/get_nav_actions';
import { DashboardContainer } from '../../embeddable';
import { Dashboard } from '../../../dashboard';
import { TopNavMenuItemRenderType, TopNavControlData } from '../../../../../navigation/public';

interface DashboardTopNavProps {
  isChromeVisible: boolean;
  savedDashboardInstance: any;
  appState: DashboardAppStateContainer;
  dashboard: Dashboard;
  currentAppState: DashboardAppState;
  isEmbeddableRendered: boolean;
  indexPatterns: IndexPattern[];
  currentContainer?: DashboardContainer;
  dashboardIdFromUrl?: string;
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
  appState,
  dashboard,
  currentAppState,
  isEmbeddableRendered,
  currentContainer,
  indexPatterns,
  dashboardIdFromUrl,
}: DashboardTopNavProps) => {
  const [topNavMenu, setTopNavMenu] = useState<any>();
  const [topRightControls, setTopRightControls] = useState<TopNavControlData[]>([]);
  const [isFullScreenMode, setIsFullScreenMode] = useState<any>();

  const { services } = useOpenSearchDashboards<DashboardServices>();
  const { TopNavMenu, HeaderControl } = services.navigation.ui;
  const { dashboardConfig, setHeaderActionMenu, keyboardShortcut } = services;
  const { setAppRightControls } = services.application;

  const handleToggleDashboardEdit = useCallback(() => {
    const editButton = document.querySelector('[data-test-subj="dashboardEditSwitch"]');
    if (editButton) {
      (editButton as HTMLElement).click();
    }
  }, []);

  const handleSave = useCallback(() => {
    const saveButton = document.querySelector('[data-test-subj="dashboardSaveMenuItem"]');
    if (saveButton && !saveButton.hasAttribute('disabled')) {
      (saveButton as HTMLElement).click();
    }
  }, []);

  const handleAdd = useCallback(() => {
    const addButton = document.querySelector('[data-test-subj="dashboardAddPanelButton"]');
    if (addButton && !addButton.hasAttribute('disabled')) {
      (addButton as HTMLElement).click();
    }
  }, []);

  // Register/unregister save shortcut based on edit mode
  useEffect(() => {
    if (currentAppState?.viewMode === 'edit' && keyboardShortcut) {
      keyboardShortcut.register({
        id: 'save_dashboard',
        pluginId: 'dashboard',
        name: 'Save Dashboard',
        category: 'editing / save',
        keys: 'cmd+s',
        execute: handleSave,
      });

      // Cleanup: unregister when leaving edit mode or component unmounts
      return () => {
        keyboardShortcut.unregister({
          id: 'save_dashboard',
          pluginId: 'dashboard',
        });
      };
    }
  }, [currentAppState?.viewMode, keyboardShortcut, handleSave]);

  // Register/unregister add shortcut based on edit mode
  useEffect(() => {
    if (currentAppState?.viewMode === 'edit' && keyboardShortcut) {
      keyboardShortcut.register({
        id: 'add_dashboard',
        pluginId: 'dashboard',
        name: 'Add Dashboard',
        category: 'Data actions',
        keys: 'a',
        execute: handleAdd,
      });

      // Cleanup: unregister when leaving edit mode or component unmounts
      return () => {
        keyboardShortcut.unregister({
          id: 'add_dashboard',
          pluginId: 'dashboard',
        });
      };
    }
  }, [currentAppState?.viewMode, keyboardShortcut, handleAdd]);

  // Register dashboard edit mode keyboard shortcut
  keyboardShortcut?.useKeyboardShortcut({
    id: 'toggle_dashboard_edit',
    pluginId: 'dashboard',
    name: 'Toggle Edit Mode',
    category: 'Panel / Layout',
    keys: 'shift+e',
    execute: handleToggleDashboardEdit,
  });

  const showActionsInGroup = services.uiSettings.get('home:useNewHomePage');

  const location = useLocation();
  const queryParameters = new URLSearchParams(location.search);

  const handleRefresh = useCallback(
    (_payload: any, isUpdate?: boolean) => {
      if (!isUpdate && currentContainer) {
        currentContainer.reload();
      }
    },
    [currentContainer]
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
        appState,
        savedDashboardInstance,
        services,
        dashboard,
        dashboardIdFromUrl,
        currentContainer
      );
      setTopNavMenu(
        showActionsInGroup
          ? getTopNavConfig(
              currentAppState?.viewMode,
              navActions,
              dashboardConfig.getHideWriteControls()
            )
          : getTopNavLegacyConfig(
              currentAppState?.viewMode,
              navActions,
              dashboardConfig.getHideWriteControls()
            )
      );
      setTopRightControls(
        showActionsInGroup ? getTopNavRightConfig(currentAppState?.viewMode, navActions) : []
      );
    }
  }, [
    currentAppState,
    services,
    dashboardConfig,
    currentContainer,
    savedDashboardInstance,
    appState,
    isEmbeddableRendered,
    dashboard,
    dashboardIdFromUrl,
    showActionsInGroup,
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
    <>
      <TopNavMenu
        appName={'dashboard'}
        config={showTopNavMenu ? topNavMenu : undefined}
        className={isFullScreenMode ? 'osdTopNavMenu-isFullScreen' : undefined}
        screenTitle={
          currentAppState.title ||
          i18n.translate('dashboard.savedSearch.newTitle', {
            defaultMessage: 'New dashboard',
          })
        }
        showSearchBar={showSearchBar && TopNavMenuItemRenderType.IN_PORTAL}
        showQueryBar={showQueryBar}
        showQueryInput={showQueryInput}
        showDatePicker={showDatePicker}
        showFilterBar={showFilterBar}
        useDefaultBehaviors={true}
        indexPatterns={indexPatterns}
        showSaveQuery={services.dashboardCapabilities.saveQuery as boolean}
        savedQuery={undefined}
        onSavedQueryIdChange={(savedQueryId?: string) => {
          appState.transitions.set('savedQuery', savedQueryId);
        }}
        savedQueryId={currentAppState?.savedQuery}
        onQuerySubmit={handleRefresh}
        setMenuMountPoint={isEmbeddedExternally ? undefined : setHeaderActionMenu}
        groupActions={showActionsInGroup}
      />
      <HeaderControl setMountPoint={setAppRightControls} controls={topRightControls} />
    </>
  );
};

export const DashboardTopNav = memo(TopNav);
