import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public'
import { getTopNavConfig } from '../top_nav/get_top_nav_config'
import { NullLiteral } from 'typescript';
import { DashboardAppState, DashboardServices, NavAction } from '../../types';
import { useParams } from 'react-router-dom';
import { SearchParams } from 'elasticsearch';
import { useSearchParams } from 'react-router-dom';
import { FilterManager } from '../../../../data/public/query/filter_manager/filter_manager';
import { Filter } from 'src/plugins/data/public';
import { SavedQuery } from '../../../../data/public/query/saved_query/types';
import { TopNavIds } from '../top_nav/top_nav_ids';
import { ViewMode } from '../../embeddable_plugin';
import { SaveResult } from 'src/plugins/saved_objects/public';
import { DashboardSaveModal } from '../top_nav/save_modal';

interface DashboardTopNavProps {
  isChromeVisible: boolean;
  savedDashboardInstance: any;
  appState: DashboardAppState;
}

/*
export function getTopNavConfig(
  dashboardMode: ViewMode,
  actions: { [key: string]: NavAction },
  hideWriteControls: boolean,
  onAppLeave?: AppMountParameters['onAppLeave']
) 
*/
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
  appState
}: DashboardTopNavProps) => {
  console.log("in dashboard top nav", "savedDashboardInstance: ", savedDashboardInstance, "appState: ", appState)
    const { embed } = useParams<{ embed: string }>();
    const { param } = useParams<{ param: string }>();

    const [filters, setFilters] = useState<Filter[]>();
    const [topNavMenu, setTopNavMenu] = useState<any>();

    const { services } = useOpenSearchDashboards<DashboardServices>();
    const { TopNavMenu } = services.navigation.ui;
    const { setHeaderActionMenu, dashboardCapabilities, data, dashboardConfig } = services;

    const { query: queryService } = data;
    const isEmbeddedExternally = Boolean(embed);

    const shouldForceDisplay = (param: string): boolean => {
      const [searchParams] = useSearchParams();
      return isEmbeddedExternally && Boolean(searchParams.get(param));
    }

    const shouldShowNavBarComponent = (forceShow: boolean): boolean =>
      (forceShow || isChromeVisible) && !appState.fullScreenMode;

    useEffect(() => {
      setFilters(queryService.filterManager.getFilters())
    }, [services])

    const navActions: {
      [key: string]: NavAction;
    } = {};
    navActions[TopNavIds.FULL_SCREEN] = () => {
      dashboardStateManager.setFullScreenMode(true);
      //updateNavBar();
    };
    navActions[TopNavIds.EXIT_EDIT_MODE] = () => onChangeViewMode(ViewMode.VIEW);
    navActions[TopNavIds.ENTER_EDIT_MODE] = () => onChangeViewMode(ViewMode.EDIT);
    navActions[TopNavIds.SAVE] = () => {
      const currentTitle = dashboardStateManager.getTitle();
      const currentDescription = dashboardStateManager.getDescription();
      const currentTimeRestore = dashboardStateManager.getTimeRestore();
      const onSave = ({
        newTitle,
        newDescription,
        newCopyOnSave,
        newTimeRestore,
        isTitleDuplicateConfirmed,
        onTitleDuplicate,
      }: {
        newTitle: string;
        newDescription: string;
        newCopyOnSave: boolean;
        newTimeRestore: boolean;
        isTitleDuplicateConfirmed: boolean;
        onTitleDuplicate: () => void;
      }) => {
        dashboardStateManager.setTitle(newTitle);
        dashboardStateManager.setDescription(newDescription);
        dashboardStateManager.savedDashboard.copyOnSave = newCopyOnSave;
        dashboardStateManager.setTimeRestore(newTimeRestore);
        const saveOptions = {
          confirmOverwrite: false,
          isTitleDuplicateConfirmed,
          onTitleDuplicate,
        };
        return save(saveOptions).then((response: SaveResult) => {
          // If the save wasn't successful, put the original values back.
          if (!(response as { id: string }).id) {
            dashboardStateManager.setTitle(currentTitle);
            dashboardStateManager.setDescription(currentDescription);
            dashboardStateManager.setTimeRestore(currentTimeRestore);
          }
          return response;
        });
      };

      const dashboardSaveModal = (
        <DashboardSaveModal
          onSave={onSave}
          onClose={() => {}}
          title={currentTitle}
          description={currentDescription}
          timeRestore={currentTimeRestore}
          showCopyOnSave={dash.id ? true : false}
        />
      );
      showSaveModal(dashboardSaveModal, i18nStart.Context);
    };
    navActions[TopNavIds.CLONE] = () => {
      const currentTitle = dashboardStateManager.getTitle();
      const onClone = (
        newTitle: string,
        isTitleDuplicateConfirmed: boolean,
        onTitleDuplicate: () => void
      ) => {
        dashboardStateManager.savedDashboard.copyOnSave = true;
        dashboardStateManager.setTitle(newTitle);
        const saveOptions = {
          confirmOverwrite: false,
          isTitleDuplicateConfirmed,
          onTitleDuplicate,
        };
        return save(saveOptions).then((response: { id?: string } | { error: Error }) => {
          // If the save wasn't successful, put the original title back.
          if ((response as { error: Error }).error) {
            dashboardStateManager.setTitle(currentTitle);
          }
          updateNavBar();
          return response;
        });
      };

      showCloneModal(onClone, currentTitle);
    };

    navActions[TopNavIds.ADD_EXISTING] = () => {
      if (dashboardContainer && !isErrorEmbeddable(dashboardContainer)) {
        openAddPanelFlyout({
          embeddable: dashboardContainer,
          getAllFactories: embeddable.getEmbeddableFactories,
          getFactory: embeddable.getEmbeddableFactory,
          notifications,
          overlays,
          SavedObjectFinder: getSavedObjectFinder(savedObjects, uiSettings),
        });
      }
    };

    navActions[TopNavIds.VISUALIZE] = async () => {
      const type = 'visualization';
      const factory = embeddable.getEmbeddableFactory(type);
      if (!factory) {
        throw new EmbeddableFactoryNotFoundError(type);
      }
      await factory.create({} as EmbeddableInput, dashboardContainer);
    };

    navActions[TopNavIds.OPTIONS] = (anchorElement) => {
      showOptionsPopover({
        anchorElement,
        useMargins: dashboardStateManager.getUseMargins(),
        onUseMarginsChange: (isChecked: boolean) => {
          dashboardStateManager.setUseMargins(isChecked);
        },
        hidePanelTitles: dashboardStateManager.getHidePanelTitles(),
        onHidePanelTitlesChange: (isChecked: boolean) => {
          dashboardStateManager.setHidePanelTitles(isChecked);
        },
      });
    };

    useEffect(() => {
      setTopNavMenu(getTopNavConfig(
        appState.viewMode,
        navActions,
        dashboardConfig.getHideWriteControls()
      ))
    }, [appState, services])

    //const filters = queryService.filterManager.getFilters()
    const shouldShowFilterBar = (forceHide: boolean): boolean =>
      !forceHide && (filters!.length > 0 || !appState.fullScreenMode);
      

    const forceShowTopNavMenu = shouldForceDisplay(UrlParams.SHOW_TOP_MENU);
    const forceShowQueryInput = shouldForceDisplay(UrlParams.SHOW_QUERY_INPUT);
    const forceShowDatePicker = shouldForceDisplay(UrlParams.SHOW_TIME_FILTER);
    const forceHideFilterBar = shouldForceDisplay(UrlParams.HIDE_FILTER_BAR);

    //const isFullScreenMode = dashboardStateManager.getFullScreenMode();
    //const screenTitle = dashboardStateManager.getTitle();
    const showTopNavMenu = shouldShowNavBarComponent(forceShowTopNavMenu);
    const showQueryInput = shouldShowNavBarComponent(forceShowQueryInput);
    const showDatePicker = shouldShowNavBarComponent(forceShowDatePicker);
    const showQueryBar = showQueryInput || showDatePicker;
    const showFilterBar = shouldShowFilterBar(forceHideFilterBar);
    const showSearchBar = showQueryBar || showFilterBar;


    /*return isChromeVisible ? (
      <TopNavMenu 
        appName={'dashboard'}
        config={showTopNavMenu ? topNavMenu : undefined}
        className={isFullScreenMode ? 'osdTopNavMenu-isFullScreen' : undefined}
        screenTitle={screenTitle}
        showTopNavMenu={showTopNavMenu}
        showSearchBar={showSearchBar}
        showQueryBar={showQueryBar}
        showQueryInput={showQueryInput}
        showDatePicker={showDatePicker}
        showFilterBar={showFilterBar}
        indexPatterns={""}
        showSaveQuery={services.dashboardCapabilities.SavedQuery}
        savedQuery={savedQuery}
        onSavedQueryIdChange={stateContainer.transitions.updateSavedQuery}
        savedQueryId: dashboardStateManager.getSavedQueryId()
        useDefaultBehaviors={true}
        onQuerySubmit: handleRefresh
        {...(isEmbeddedExternally ? {} : { setMenuMountPoint: setHeaderActionMenu })}
      />
    ): null;*/

    return isChromeVisible ? (
      <TopNavMenu
        appName={'dashboard'}
        savedQueryId={appState.savedQuery}
        config={showTopNavMenu ? topNavMenu : undefined}
        /*className={isFullScreenMode ? 'osdTopNavMenu-isFullScreen' : undefined}
        screenTitle={screenTitle}
        //showTopNavMenu={showTopNavMenu}
        showSearchBar={showSearchBar}
        showQueryBar={showQueryBar}
        showQueryInput={showQueryInput}
        showDatePicker={showDatePicker}
        showFilterBar={showFilterBar}
        indexPatterns={[]}
        showSaveQuery={services.dashboardCapabilities.SavedQuery}*/
      />
    ):null;
}

export const DashboardTopNav = memo(TopNav)

