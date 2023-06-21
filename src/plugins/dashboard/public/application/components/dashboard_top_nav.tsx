/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { uniqBy } from 'lodash';
import React, { memo, useState, useEffect } from 'react';
import { Filter, IndexPattern } from 'src/plugins/data/public';
import { useCallback } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getTopNavConfig } from '../top_nav/get_top_nav_config';
import { DashboardAppStateContainer, DashboardAppState, DashboardServices } from '../../types';
import { getNavActions } from '../utils/get_nav_actions';
import { DashboardContainer } from '../embeddable';
import { isErrorEmbeddable } from '../../embeddable_plugin';

interface DashboardTopNavProps {
  isChromeVisible: boolean;
  savedDashboardInstance: any;
  stateContainer: DashboardAppStateContainer;
  currentAppState: DashboardAppState;
  isEmbeddableRendered: boolean;
  dashboardContainer?: DashboardContainer;
}

enum UrlParams {
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
  currentAppState,
  isEmbeddableRendered,
  dashboardContainer,
}: DashboardTopNavProps) => {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [topNavMenu, setTopNavMenu] = useState<any>();
  const [isFullScreenMode, setIsFullScreenMode] = useState<any>();
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[]>();

  const { services } = useOpenSearchDashboards<DashboardServices>();
  const { TopNavMenu } = services.navigation.ui;
  const { data, dashboardConfig, setHeaderActionMenu } = services;
  const { query: queryService } = data;

  const handleRefresh = useCallback(
    (_payload: any, isUpdate?: boolean) => {
      if (!isUpdate && dashboardContainer) {
        dashboardContainer.reload();
      }
    },
    [dashboardContainer]
  );

  // TODO: this should base on URL
  const isEmbeddedExternally = false;

  // TODO: should use URL params
  const shouldForceDisplay = (param: string): boolean => {
    // const [searchParams] = useSearchParams();
    return false;
  };

  const shouldShowNavBarComponent = (forceShow: boolean): boolean =>
    (forceShow || isChromeVisible) && !currentAppState?.fullScreenMode;

  useEffect(() => {
    setFilters(queryService.filterManager.getFilters());
  }, [services, queryService]);

  useEffect(() => {
    if (isEmbeddableRendered) {
      const navActions = getNavActions(
        stateContainer,
        savedDashboardInstance,
        services,
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
  ]);

  useEffect(() => {
    setIsFullScreenMode(currentAppState?.fullScreenMode);
  }, [currentAppState, services]);

  useEffect(() => {
    const asyncSetIndexPattern = async () => {
      if (dashboardContainer) {
        let panelIndexPatterns: IndexPattern[] = [];
        dashboardContainer.getChildIds().forEach((id) => {
          const embeddableInstance = dashboardContainer.getChild(id);
          if (isErrorEmbeddable(embeddableInstance)) return;
          const embeddableIndexPatterns = (embeddableInstance.getOutput() as any).indexPatterns;
          if (!embeddableIndexPatterns) return;
          panelIndexPatterns.push(...embeddableIndexPatterns);
        });
        panelIndexPatterns = uniqBy(panelIndexPatterns, 'id');

        if (panelIndexPatterns.length > 0) {
          setIndexPatterns(panelIndexPatterns);
        } else {
          const defaultIndex = await services.data.indexPatterns.getDefault();
          if (defaultIndex) {
            setIndexPatterns([defaultIndex]);
          }
        }
      }
    };

    asyncSetIndexPattern();
  }, [dashboardContainer, stateContainer, currentAppState, services.data.indexPatterns]);

  const shouldShowFilterBar = (forceHide: boolean): boolean =>
    !forceHide && (filters!.length > 0 || !currentAppState?.fullScreenMode);

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

  return isChromeVisible ? (
    <TopNavMenu
      appName={'dashboard'}
      savedQueryId={currentAppState?.savedQuery}
      config={showTopNavMenu ? topNavMenu : undefined}
      className={isFullScreenMode ? 'osdTopNavMenu-isFullScreen' : undefined}
      screenTitle={currentAppState.title}
      // showTopNavMenu={showTopNavMenu}
      showSearchBar={showSearchBar}
      showQueryBar={showQueryBar}
      showQueryInput={showQueryInput}
      showDatePicker={showDatePicker}
      showFilterBar={showFilterBar}
      useDefaultBehaviors={true}
      indexPatterns={indexPatterns}
      showSaveQuery={services.dashboardCapabilities.saveQuery as boolean}
      savedQuery={undefined}
      onSavedQueryIdChange={() => {}}
      onQuerySubmit={handleRefresh}
      setMenuMountPoint={isEmbeddedExternally ? undefined : setHeaderActionMenu}
    />
  ) : null;
};

export const DashboardTopNav = memo(TopNav);
