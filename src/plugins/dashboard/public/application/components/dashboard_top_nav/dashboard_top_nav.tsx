/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { memo, useState, useEffect, useCallback } from 'react';
import { EuiCallOut, EuiFlexGroup, EuiFlexItem, EuiText, EuiSmallButtonEmpty } from '@elastic/eui';
import { IndexPattern } from 'src/plugins/data/public';
import { useLocation } from 'react-router-dom';
import { i18n } from '@osd/i18n';
import { take } from 'rxjs/operators';
import { DEFAULT_NAV_GROUPS, isNavGroupInFeatureConfigs } from 'opensearch-dashboards/public';
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
import './dashboard_top_nav.scss';

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
  eventEmitter?: any;
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
  eventEmitter,
}: DashboardTopNavProps) => {
  const [topNavMenu, setTopNavMenu] = useState<any>();
  const [topRightControls, setTopRightControls] = useState<TopNavControlData[]>([]);
  const [isFullScreenMode, setIsFullScreenMode] = useState<any>();
  const [isObservabilityOrAnalyticsWorkspace, setIsObservabilityOrAnalyticsWorkspace] = useState(
    false
  );
  const [userRestoredSearchBar, setUserRestoredSearchBar] = useState(false);

  const { services } = useOpenSearchDashboards<DashboardServices>();
  const { TopNavMenu, HeaderControl } = services.navigation.ui;
  const { dashboardConfig, setHeaderActionMenu, keyboardShortcut, workspaces } = services;
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

  // Listen for triggerDashboardSave event from DashboardVariables
  useEffect(() => {
    if (eventEmitter) {
      const handleTriggerSave = () => {
        handleSave();
      };
      eventEmitter.on('triggerDashboardSave', handleTriggerSave);
      return () => {
        eventEmitter.off('triggerDashboardSave', handleTriggerSave);
      };
    }
  }, [eventEmitter, handleSave]);

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

  // Check if current workspace is Observability or Analytics
  useEffect(() => {
    workspaces.currentWorkspace$
      .pipe(take(1))
      .toPromise()
      .then((ws) => {
        const features = ws?.features;
        // The 'all' nav group represents Analytics workspace
        const isTargetWorkspace =
          features &&
          (isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS.observability.id, features) ||
            isNavGroupInFeatureConfigs(DEFAULT_NAV_GROUPS.all.id, features));
        setIsObservabilityOrAnalyticsWorkspace(!!isTargetWorkspace);
      });
  }, [workspaces.currentWorkspace$]);

  // Helper to check if query is empty (only for string queries or Query objects)
  const isQueryEmpty = (query: any): boolean => {
    if (!query) return true;
    if (typeof query === 'string') return query.trim() === '';
    if (typeof query === 'object' && 'query' in query) {
      return !query.query || query.query.trim() === '';
    }
    return false;
  };

  // Helper to check if filters are empty
  const areFiltersEmpty = (filters: any[]): boolean => {
    return !filters || filters.length === 0;
  };

  // Check if searchSource has non-empty query or filters
  const hasSearchSourceContent = (): boolean => {
    if (!savedDashboardInstance?.searchSource) return false;
    const query = savedDashboardInstance.getQuery();
    const filters = savedDashboardInstance.getFilters();
    return !isQueryEmpty(query) || !areFiltersEmpty(filters);
  };

  const shouldShowFilterBar = (forceHide: boolean): boolean =>
    !forceHide && (currentAppState.filters!.length > 0 || !currentAppState?.fullScreenMode);

  const forceShowTopNavMenu = shouldForceDisplay(UrlParams.SHOW_TOP_MENU);
  const forceShowQueryInput = shouldForceDisplay(UrlParams.SHOW_QUERY_INPUT);
  const forceShowDatePicker = shouldForceDisplay(UrlParams.SHOW_TIME_FILTER);
  const forceHideFilterBar = shouldForceDisplay(UrlParams.HIDE_FILTER_BAR);
  const showTopNavMenu = shouldShowNavBarComponent(forceShowTopNavMenu);

  // Workspace-specific logic for Observability and Analytics
  // In these workspaces, we hide the search bar by default to encourage using Variables
  const shouldHideSearchBarForWorkspace =
    isObservabilityOrAnalyticsWorkspace && !userRestoredSearchBar && !isEmbeddedExternally;

  const shouldShowMigrationCallout =
    isObservabilityOrAnalyticsWorkspace &&
    hasSearchSourceContent() &&
    !userRestoredSearchBar &&
    !isEmbeddedExternally;

  let showQueryInput = shouldShowNavBarComponent(forceShowQueryInput);
  const showDatePicker = shouldShowNavBarComponent(forceShowDatePicker);
  let showFilterBar = shouldShowFilterBar(forceHideFilterBar);

  // Override for workspace-specific hiding
  if (shouldHideSearchBarForWorkspace) {
    showQueryInput = false;
    showFilterBar = false;
  }

  const showQueryBar = showQueryInput || showDatePicker;
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

      {/* Show migration callout when legacy search content exists */}
      {shouldShowMigrationCallout && (
        <EuiCallOut color="primary" size="s" dismissible className="dshMigrationCallout">
          <EuiFlexGroup alignItems="center" justifyContent="flexStart" gutterSize="xs">
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                {i18n.translate('dashboard.topNav.migrationCallout.description', {
                  defaultMessage:
                    'This dashboard has legacy query or filter bars. Consider using Variables for better flexibility.',
                })}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiSmallButtonEmpty
                color="primary"
                onClick={() => setUserRestoredSearchBar(true)}
                data-test-subj="restoreSearchBarButton"
                iconType="eye"
              >
                {i18n.translate('dashboard.topNav.migrationCallout.restoreButton', {
                  defaultMessage: 'Show filter and search bar',
                })}
              </EuiSmallButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiCallOut>
      )}
    </>
  );
};

export const DashboardTopNav = memo(TopNav);
