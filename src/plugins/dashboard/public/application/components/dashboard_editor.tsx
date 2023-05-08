import React, { useEffect, useState } from "react";
import { DashboardViewport } from '../embeddable/viewport/dashboard_viewport';
import { useParams } from 'react-router-dom';
import { DashboardTopNav } from '../components/dashboard_top_nav'
import { useChromeVisibility } from '../utils/use/use_chrome_visibility'
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public'
import { EventEmitter } from 'events';
import { useSavedDashboardInstance } from "../utils/use/use_saved_dashboard_instance";
import { useDashboardAppState } from "../utils/use/use_dashboard_app_state";
import { DashboardServices, SavedDashboardPanel } from "../../types";
import { DashboardStateManager } from "../dashboard_state_manager";
import { DASHBOARD_CONTAINER_TYPE, DashboardContainer, DashboardContainerInput, DashboardPanelState } from "../embeddable";
import { EMPTY, Subscription, merge } from "rxjs";
import { ContainerOutput, ErrorEmbeddable, ViewMode, isErrorEmbeddable } from "../../embeddable_plugin";
import { DashboardEmptyScreen, DashboardEmptyScreenProps } from "../dashboard_empty_screen";
import { convertSavedDashboardPanelToPanelState } from "../lib/embeddable_saved_object_converters";
import { catchError, distinctUntilChanged, map, mapTo, startWith, switchMap } from "rxjs/operators";
import deepEqual from 'fast-deep-equal'

export const DashboardEditor = () => {
    const { id: dashboardIdFromUrl } = useParams<{ id: string }>();
    const { services } = useOpenSearchDashboards<DashboardServices>();
    const { embeddable, data, dashboardConfig, embeddableCapabilities, uiSettings, http } = services;
    const {query:queryService} = data;
    const { visualizeCapabilities, mapsCapabilities } = embeddableCapabilities;
    const timefilter = queryService.timefilter.timefilter;
    const isChromeVisible = useChromeVisibility(services.chrome);
    const [eventEmitter] = useState(new EventEmitter());

    const { savedDashboardInstance } = useSavedDashboardInstance(
        services, 
        eventEmitter, 
        isChromeVisible, 
        dashboardIdFromUrl
    )
    console.log("in editor, saved dashboard", savedDashboardInstance)

    const { appState } = useDashboardAppState(
        services, 
        eventEmitter,
        savedDashboardInstance
    )
    console.log("in editor, saved app state", appState)

   /* const { currentAppState } = useEditorUpdates(
        services, 
        eventEmitter, 
        setHasUnsavedChanges,
        appState,
        savedDashboardInstance
    )

    useEffect(() => {
        // clean up all registered listeners if any is left
        return () => {
          eventEmitter.removeAllListeners();
        };
      }, [eventEmitter]);*/


    const appStateData = appState?.get()
    if(!appStateData){
        return null;
    }
    let dashboardContainer: DashboardContainer | undefined;
    let inputSubscription: Subscription | undefined;
    let outputSubscription: Subscription | undefined;

    const dashboardDom = document.getElementById('dashboardViewport');
    const dashboardFactory = embeddable.getEmbeddableFactory<
      DashboardContainerInput,
      ContainerOutput,
      DashboardContainer
    >(DASHBOARD_CONTAINER_TYPE);

    const getShouldShowEditHelp = () => {
        return (!appStateData.panels.length &&
            appStateData.viewMode === ViewMode.EDIT &&
        !dashboardConfig.getHideWriteControls());
    }

    const getShouldShowViewHelp = () => {
        return (
            !appStateData.panels.length &&
            appStateData.viewMode === ViewMode.VIEW &&
            !dashboardConfig.getHideWriteControls()
        )
    }

    const shouldShowUnauthorizedEmptyState = () => {
        const readonlyMode =
        !appStateData.panels.length &&
        !getShouldShowEditHelp() &&
        !getShouldShowViewHelp() &&
        dashboardConfig.getHideWriteControls();
      const userHasNoPermissions =
      !appStateData.panels.length &&
        !visualizeCapabilities.save &&
        !mapsCapabilities.save;
      return readonlyMode || userHasNoPermissions;
    }

    const getEmptyScreenProps = (
        shouldShowEditHelp: boolean,
        isEmptyInReadOnlyMode: boolean
      ): DashboardEmptyScreenProps => {
        const emptyScreenProps: DashboardEmptyScreenProps = {
          onLinkClick: ()=>{}, //TODO
          showLinkToVisualize: shouldShowEditHelp,
          uiSettings,
          http,
        };
        if (shouldShowEditHelp) {
          emptyScreenProps.onVisualizeClick = () => {
            alert("click") //TODO
          };
        }
        if (isEmptyInReadOnlyMode) {
          emptyScreenProps.isReadonlyMode = true;
        }
        return emptyScreenProps;
      };


    const getDashboardInput= () => {
        const embeddablesMap: {
            [key: string]: DashboardPanelState;
          } = {};
          appStateData.panels.forEach((panel: SavedDashboardPanel) => {
            embeddablesMap[panel.panelIndex] = convertSavedDashboardPanelToPanelState(panel);
          });
          
        let lastReloadRequestTime = 0;
        return {
            id: savedDashboardInstance.id || '',
            filters: appStateData.filters,
            hidePanelTitles: appStateData?.options.hidePanelTitles,
            query: appStateData.query,
            timeRange: {
                ..._.cloneDeep(timefilter.getTime()),
            },
            refreshConfig: timefilter.getRefreshInterval(),
            viewMode: appStateData.viewMode,
            panels: embeddablesMap,
            isFullScreenMode: appStateData?.fullScreenMode,
            isEmbeddedExternally: false, //TODO
            //isEmptyState: shouldShowEditHelp || shouldShowViewHelp || isEmptyInReadonlyMode,
            isEmptyState: false, //TODO
            useMargins: appStateData.options.useMargins,
            lastReloadRequestTime,//TODO
            title: appStateData.title,
            description: appStateData.description,
            expandedPanelId: appStateData.expandedPanelId,
        }
    }

    if (dashboardFactory) {
      dashboardFactory
        .create(getDashboardInput())
        .then((container: DashboardContainer | ErrorEmbeddable | undefined) => {
          if (container && !isErrorEmbeddable(container)) {
            dashboardContainer = container;

            dashboardContainer.renderEmpty = () => {
              const shouldShowEditHelp = getShouldShowEditHelp();
              const shouldShowViewHelp = getShouldShowViewHelp();
              const isEmptyInReadOnlyMode = shouldShowUnauthorizedEmptyState();
              const isEmptyState =
                shouldShowEditHelp || shouldShowViewHelp || isEmptyInReadOnlyMode;
              return isEmptyState ? (
                <DashboardEmptyScreen
                  {...getEmptyScreenProps(shouldShowEditHelp, isEmptyInReadOnlyMode)}
                />
              ) : null;
            };

            outputSubscription = merge(
              // output of dashboard container itself
              dashboardContainer.getOutput$(),
              // plus output of dashboard container children,
              // children may change, so make sure we subscribe/unsubscribe with switchMap
              dashboardContainer.getOutput$().pipe(
                map(() => dashboardContainer!.getChildIds()),
                distinctUntilChanged(deepEqual),
                switchMap((newChildIds: string[]) =>
                  merge(
                    ...newChildIds.map((childId) =>
                      dashboardContainer!
                        .getChild(childId)
                        .getOutput$()
                        .pipe(catchError(() => EMPTY))
                    )
                  )
                )
              )
            )
              .pipe(
                mapTo(dashboardContainer),
                startWith(dashboardContainer), // to trigger initial index pattern update
                //updateIndexPatternsOperator //TODO
              )
              .subscribe();

            inputSubscription = dashboardContainer.getInput$().subscribe(() => {
             
            });

          if (dashboardDom && container) {
            container.render(dashboardDom);
          }
        }
        })
    }

    return (
        <div>
            {savedDashboardInstance && appState && (
                <DashboardTopNav 
            isChromeVisible={isChromeVisible}
            savedDashboardInstance={savedDashboardInstance}
            appState={appState}
        />
            )}
            
        </div>
    )
}