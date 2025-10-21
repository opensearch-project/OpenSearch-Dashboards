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
import { TopNavIds } from './top_nav';
import { ViewMode, isErrorEmbeddable, openAddPanelFlyout } from '../../../../../embeddable/public';
import { getSavedObjectFinder } from '../../../../../saved_objects/public';

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

  // State for cancel button functionality
  const [isQueryRunning, setIsQueryRunning] = useState<boolean>(false);
  const [showCancelButton, setShowCancelButton] = useState<boolean>(false);

  const { services } = useOpenSearchDashboards<DashboardServices>();
  const { TopNavMenu, HeaderControl } = services.navigation.ui;
  const { dashboardConfig, setHeaderActionMenu, keyboardShortcut } = services;
  const { setAppRightControls } = services.application;

  // Get nav actions for direct function calls
  const keyboardNavActions = getNavActions(
    appState,
    savedDashboardInstance,
    services,
    dashboard,
    dashboardIdFromUrl,
    currentContainer
  );

  const handleToggleDashboardEdit = useCallback(() => {
    const isEditMode = currentAppState?.viewMode === ViewMode.EDIT;
    const actionId = isEditMode ? TopNavIds.EXIT_EDIT_MODE : TopNavIds.ENTER_EDIT_MODE;
    if (keyboardNavActions[actionId]) {
      keyboardNavActions[actionId]();
    }
  }, [keyboardNavActions, currentAppState]);

  const handleSave = useCallback(() => {
    if (keyboardNavActions[TopNavIds.SAVE]) {
      keyboardNavActions[TopNavIds.SAVE]();
    }
  }, [keyboardNavActions]);

  const handleAddPanel = useCallback(() => {
    // directly open the add panel flyout
    if (currentContainer && !isErrorEmbeddable(currentContainer)) {
      openAddPanelFlyout({
        embeddable: currentContainer,
        getAllFactories: services.embeddable.getEmbeddableFactories,
        getFactory: services.embeddable.getEmbeddableFactory,
        notifications: services.notifications,
        overlays: services.overlays,
        SavedObjectFinder: getSavedObjectFinder(
          services.savedObjects,
          services.uiSettings,
          services.data,
          services.application
        ),
      });
    }
  }, [currentContainer, services]);

  // Register/unregister save shortcut based on edit mode
  useEffect(() => {
    if (currentAppState?.viewMode === ViewMode.EDIT && keyboardShortcut) {
      keyboardShortcut.register({
        id: 'save_dashboard',
        pluginId: 'dashboard',
        name: i18n.translate('dashboard.topNav.saveDashboardShortcut', {
          defaultMessage: 'Save dashboard',
        }),
        category: i18n.translate('dashboard.topNav.editingCategory', {
          defaultMessage: 'Data actions',
        }),
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
    if (currentAppState?.viewMode === ViewMode.EDIT && keyboardShortcut) {
      keyboardShortcut.register({
        id: 'add_panel_to_dashboard',
        pluginId: 'dashboard',
        name: i18n.translate('dashboard.topNav.addPanelShortcut', {
          defaultMessage: 'Add panel to dashboard',
        }),
        category: i18n.translate('dashboard.topNav.dataActionsCategory', {
          defaultMessage: 'Data actions',
        }),
        keys: 'a',
        execute: handleAddPanel,
      });

      // Cleanup: unregister when leaving edit mode or component unmounts
      return () => {
        keyboardShortcut.unregister({
          id: 'add_panel_to_dashboard',
          pluginId: 'dashboard',
        });
      };
    }
  }, [currentAppState?.viewMode, keyboardShortcut, handleAddPanel]);

  // Register dashboard edit mode keyboard shortcut
  keyboardShortcut?.useKeyboardShortcut({
    id: 'toggle_dashboard_edit',
    pluginId: 'dashboard',
    name: i18n.translate('dashboard.topNav.toggleEditModeShortcut', {
      defaultMessage: 'Toggle edit mode',
    }),
    category: i18n.translate('dashboard.topNav.panelLayoutCategory', {
      defaultMessage: 'Panel / layout',
    }),
    keys: 'shift+e',
    execute: handleToggleDashboardEdit,
  });

  const showActionsInGroup = services.uiSettings.get('home:useNewHomePage');

  const location = useLocation();
  const queryParameters = new URLSearchParams(location.search);

  const handleRefresh = useCallback(
    (_payload: any, isUpdate?: boolean) => {
      if (!isUpdate && currentContainer) {
        // Set query running state when starting refresh
        setIsQueryRunning(true);
        setShowCancelButton(true);

        // Reload the dashboard container
        currentContainer.reload();

        // Monitor container state to detect when queries complete
        // Use a simple timeout for now - more sophisticated panel monitoring can be added later
        const timeoutId = setTimeout(() => {
          setIsQueryRunning(false);
          setShowCancelButton(false);
        }, 3000); // 3 second timeout for queries to complete

        // Store timeout ID for potential cleanup in cancel handler
        (currentContainer as any).__refreshTimeoutId = timeoutId;
      }
    },
    [currentContainer]
  );

  // Handle query cancellation
  const handleQueryCancel = useCallback(() => {
    if (currentContainer) {
      // Clear the timeout if it exists
      const timeoutId = (currentContainer as any).__refreshTimeoutId;
      if (timeoutId) {
        clearTimeout(timeoutId);
        delete (currentContainer as any).__refreshTimeoutId;
      }

      // Cancel search requests at the interceptor level (like Explore does)
      try {
        // Get the search interceptor and abort its controller
        const searchInterceptor = services.data?.search?.getDefaultSearchInterceptor?.();
        if (searchInterceptor && (searchInterceptor as any).abortController) {
          console.log('🚫 Aborting search interceptor controller');
          (searchInterceptor as any).abortController.abort();
        }
      } catch (error) {
        console.warn('Could not cancel through search interceptor:', error);
      }

      // Cancel individual panel queries directly - use immediate approach
      const panels = currentContainer.getChildIds();
      console.log(`🔍 Dashboard cancel: Found ${panels.length} panels`);
      let cancelledCount = 0;

      panels.forEach((panelId) => {
        const panel = currentContainer.getChild(panelId);
        if (panel && (panel as any).abortController) {
          try {
            const abortController = (panel as any).abortController;
            if (abortController && typeof abortController.abort === 'function') {
              console.log(`🚫 Aborting panel ${panelId}, signal.aborted before:`, abortController.signal.aborted);
              abortController.abort();
              console.log(`🚫 Panel ${panelId} signal.aborted after:`, abortController.signal.aborted);
              cancelledCount++;
            }
          } catch (error) {
            console.warn(`Error aborting panel ${panelId}:`, error);
          }
        }
      });

      console.log(`🔍 Successfully cancelled ${cancelledCount} panel queries`);

      // Reset query state immediately
      setIsQueryRunning(false);
      setShowCancelButton(false);
    }
  }, [currentContainer, services]);

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
        showCancelButton={showCancelButton}
        onQueryCancel={handleQueryCancel}
        isQueryRunning={isQueryRunning}
      />
      <HeaderControl setMountPoint={setAppRightControls} controls={topRightControls} />
    </>
  );
};

export const DashboardTopNav = memo(TopNav);
