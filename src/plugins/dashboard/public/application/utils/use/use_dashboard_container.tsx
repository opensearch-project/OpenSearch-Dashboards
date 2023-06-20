/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EMPTY, Subscription, merge } from 'rxjs';
import { catchError, distinctUntilChanged, map, mapTo, startWith, switchMap } from 'rxjs/operators';
import deepEqual from 'fast-deep-equal';
import { EventEmitter } from 'stream';
import { useEffect } from 'react';
import { opensearchFilters } from '../../../../../data/public';
import {
  DASHBOARD_CONTAINER_TYPE,
  DashboardContainer,
  DashboardContainerInput,
  DashboardPanelState,
} from '../../embeddable';
import {
  ContainerOutput,
  ErrorEmbeddable,
  ViewMode,
  isErrorEmbeddable,
} from '../../../embeddable_plugin';
import { convertSavedDashboardPanelToPanelState } from '../../lib/embeddable_saved_object_converters';
import { DashboardEmptyScreen, DashboardEmptyScreenProps } from '../../dashboard_empty_screen';
import { DashboardAppStateContainer, DashboardServices, SavedDashboardPanel } from '../../../types';

export const useDashboardContainer = (
  services: DashboardServices,
  isChromeVisible: boolean,
  eventEmitter: EventEmitter,
  savedDashboardInstance?: any,
  appState?: DashboardAppStateContainer
) => {
  const [dashboardContainer, setDashboardContainer] = useState<DashboardContainer>();

  useEffect(() => {
    const getDashboardContainer = async () => {
      try {
        if (savedDashboardInstance && appState) {
          let dashboardContainerEmbeddable: DashboardContainer | undefined;
          try {
            dashboardContainerEmbeddable = await createDashboardEmbeddable(
              savedDashboardInstance,
              services,
              appState
            );
          } catch (error) {
            console.log(error);
          }
          setDashboardContainer(dashboardContainerEmbeddable);
        }
      } catch (error) {
        console.log(error);
      }
    };

    getDashboardContainer();
  }, [savedDashboardInstance, appState]);

  return { dashboardContainer };
};

const createDashboardEmbeddable = async (
  savedDash: any,
  dashboardServices: DashboardServices,
  appState: DashboardAppStateContainer
) => {
  let dashboardContainer: DashboardContainer;
  let inputSubscription: Subscription | undefined;
  let outputSubscription: Subscription | undefined;

  const {
    embeddable,
    data,
    uiSettings,
    http,
    dashboardConfig,
    embeddableCapabilities,
  } = dashboardServices;
  const { query: queryService } = data;
  const filterManager = queryService.filterManager;
  const timefilter = queryService.timefilter.timefilter;
  const queryStringManager = queryService.queryString;
  const { visualizeCapabilities, mapsCapabilities } = embeddableCapabilities;
  // const dashboardDom = document.getElementById('dashboardViewport');
  const dashboardFactory = embeddable.getEmbeddableFactory<
    DashboardContainerInput,
    ContainerOutput,
    DashboardContainer
  >(DASHBOARD_CONTAINER_TYPE);

  const getShouldShowEditHelp = () => {
    return (
      !savedDash.panels.length &&
      savedDash.viewMode === ViewMode.EDIT &&
      !dashboardConfig.getHideWriteControls()
    );
  };

  const getShouldShowViewHelp = () => {
    return (
      !savedDash.panels.length &&
      savedDash.viewMode === ViewMode.VIEW &&
      !dashboardConfig.getHideWriteControls()
    );
  };

  const shouldShowUnauthorizedEmptyState = () => {
    const readonlyMode =
      !savedDash.panels.length &&
      !getShouldShowEditHelp() &&
      !getShouldShowViewHelp() &&
      dashboardConfig.getHideWriteControls();
    const userHasNoPermissions =
      !savedDash.panels.length && !visualizeCapabilities.save && !mapsCapabilities.save;
    return readonlyMode || userHasNoPermissions;
  };

  const getEmptyScreenProps = (
    shouldShowEditHelp: boolean,
    isEmptyInReadOnlyMode: boolean
  ): DashboardEmptyScreenProps => {
    const emptyScreenProps: DashboardEmptyScreenProps = {
      onLinkClick: () => {}, // TODO
      showLinkToVisualize: shouldShowEditHelp,
      uiSettings,
      http,
    };
    if (shouldShowEditHelp) {
      emptyScreenProps.onVisualizeClick = () => {
        alert('click'); // TODO
      };
    }
    if (isEmptyInReadOnlyMode) {
      emptyScreenProps.isReadonlyMode = true;
    }
    return emptyScreenProps;
  };

  const getDashboardInput = () => {
    const appStateData = appState.getState();
    const embeddablesMap: {
      [key: string]: DashboardPanelState;
    } = {};
    appStateData.panels.forEach((panel: SavedDashboardPanel) => {
      embeddablesMap[panel.panelIndex] = convertSavedDashboardPanelToPanelState(panel);
    });

    const lastReloadRequestTime = 0;
    return {
      id: savedDash.id || '',
      filters: data.query.filterManager.getFilters(),
      hidePanelTitles: appStateData.options.hidePanelTitles,
      query: savedDash.query,
      timeRange: data.query.timefilter.timefilter.getTime(),
      refreshConfig: data.query.timefilter.timefilter.getRefreshInterval(),
      viewMode: appStateData.viewMode,
      panels: embeddablesMap,
      isFullScreenMode: appStateData.fullScreenMode,
      isEmbeddedExternally: false, // TODO
      // isEmptyState: shouldShowEditHelp || shouldShowViewHelp || isEmptyInReadonlyMode,
      isEmptyState: false, // TODO
      useMargins: appStateData.options.useMargins,
      lastReloadRequestTime, // TODO
      title: appStateData.title,
      description: appStateData.description,
      expandedPanelId: appStateData.expandedPanelId,
    };
  };

  if (dashboardFactory) {
    return dashboardFactory
      .create(getDashboardInput())
      .then((container: DashboardContainer | ErrorEmbeddable | undefined) => {
        if (container && !isErrorEmbeddable(container)) {
          dashboardContainer = container;

          dashboardContainer.renderEmpty = () => {
            const shouldShowEditHelp = getShouldShowEditHelp();
            const shouldShowViewHelp = getShouldShowViewHelp();
            const isEmptyInReadOnlyMode = shouldShowUnauthorizedEmptyState();
            const isEmptyState = shouldShowEditHelp || shouldShowViewHelp || isEmptyInReadOnlyMode;
            return isEmptyState ? (
              <DashboardEmptyScreen
                {...getEmptyScreenProps(shouldShowEditHelp, isEmptyInReadOnlyMode)}
              />
            ) : null;
          };

          // TODO: handle dashboard container input and output subsciptions
          // issue:
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
              startWith(dashboardContainer) // to trigger initial index pattern update
              // updateIndexPatternsOperator //TODO
            )
            .subscribe();

          inputSubscription = dashboardContainer.getInput$().subscribe((foo) => {
            // This has to be first because handleDashboardContainerChanges causes
            // appState.save which will cause refreshDashboardContainer to be called.

            if (
              !opensearchFilters.compareFilters(
                container.getInput().filters,
                filterManager.getFilters(),
                opensearchFilters.COMPARE_ALL_OPTIONS
              )
            ) {
              // Add filters modifies the object passed to it, hence the clone deep.
              filterManager.addFilters(_.cloneDeep(container.getInput().filters));

              /* dashboardStateManager.applyFilters(
                  $scope.model.query,
                  container.getInput().filters
                );*/

              appState.transitions.set('query', queryStringManager.getQuery());
            }
            // TODO: triggered when dashboard embeddable container has changes, and update the appState
            // handleDashboardContainerChanges(container, appState, dashboardServices);
          });
          return dashboardContainer;
        }
      });
  }
  return undefined;
};
