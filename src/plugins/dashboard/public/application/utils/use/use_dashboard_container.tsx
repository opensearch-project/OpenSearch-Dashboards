/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { cloneDeep, isEqual } from 'lodash';
import { EMPTY, Observable, Subscription, merge, of, pipe } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  mapTo,
  startWith,
  switchMap,
} from 'rxjs/operators';
import deepEqual from 'fast-deep-equal';
import { EventEmitter } from 'stream';
import { useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { IndexPattern, opensearchFilters } from '../../../../../data/public';
import {
  DASHBOARD_CONTAINER_TYPE,
  DashboardContainer,
  DashboardContainerInput,
  DashboardPanelState,
} from '../../embeddable';
import {
  ContainerOutput,
  EmbeddableInput,
  ErrorEmbeddable,
  ViewMode,
  isErrorEmbeddable,
} from '../../../embeddable_plugin';
import {
  convertPanelStateToSavedDashboardPanel,
  convertSavedDashboardPanelToPanelState,
} from '../../lib/embeddable_saved_object_converters';
import { DashboardEmptyScreen, DashboardEmptyScreenProps } from '../../dashboard_empty_screen';
import { DashboardAppStateContainer, DashboardServices, SavedDashboardPanel } from '../../../types';
import { migrateLegacyQuery } from '../../lib/migrate_legacy_query';
import { DashboardConstants } from '../../../dashboard_constants';

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
          const dashboardContainerEmbeddable = await createDashboardEmbeddable(
            savedDashboardInstance,
            services,
            appState
          );

          setDashboardContainer(dashboardContainerEmbeddable);
        }
      } catch (error) {
        services.toastNotifications.addWarning({
          title: i18n.translate('dashboard.createDashboard.failedToLoadErrorMessage', {
            defaultMessage: 'Failed to load the dashboard',
          }),
        });
        services.history.replace(DashboardConstants.LANDING_PAGE_PATH);
      }
    };

    getDashboardContainer();
  }, [savedDashboardInstance, appState, services]);

  useEffect(() => {
    const incomingEmbeddable = services.embeddable
      .getStateTransfer(services.scopedHistory())
      .getIncomingEmbeddablePackage();

    if (
      incomingEmbeddable &&
      !dashboardContainer?.getInput().panels[incomingEmbeddable.embeddableId!]
    ) {
      dashboardContainer?.addNewEmbeddable<EmbeddableInput>(
        incomingEmbeddable.type,
        incomingEmbeddable.input
      );
    }
  }, [dashboardContainer, services]);

  return { dashboardContainer };
};

const createDashboardEmbeddable = (
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
      query: data.query.queryString.getQuery(),
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

          dashboardContainer.getChangesFromAppStateForContainerState = (currentContainer: any) => {
            const appStateDashboardInput = getDashboardInput();
            if (!dashboardContainer || isErrorEmbeddable(dashboardContainer)) {
              return appStateDashboardInput;
            }

            const containerInput = currentContainer.getInput();
            const differences: Partial<DashboardContainerInput> = {};

            // Filters shouldn't  be compared using regular isEqual
            if (
              !opensearchFilters.compareFilters(
                containerInput.filters,
                appStateDashboardInput.filters,
                opensearchFilters.COMPARE_ALL_OPTIONS
              )
            ) {
              differences.filters = appStateDashboardInput.filters;
            }

            Object.keys(containerInput).forEach((key) => {
              if (key === 'filters') return;
              const containerValue = (containerInput as { [key: string]: unknown })[key];
              const appStateValue = ((appStateDashboardInput as unknown) as {
                [key: string]: unknown;
              })[key];
              if (!isEqual(containerValue, appStateValue)) {
                (differences as { [key: string]: unknown })[key] = appStateValue;
              }
            });

            // cloneDeep hack is needed, as there are multiple place, where container's input mutated,
            // but values from appStateValue are deeply frozen, as they can't be mutated directly
            return Object.values(differences).length === 0 ? undefined : cloneDeep(differences);
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
            )
            .subscribe();

          inputSubscription = dashboardContainer.getInput$().subscribe(() => {
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
              filterManager.addFilters(cloneDeep(container.getInput().filters));

              // TODO: investigate if this is needed
              /* dashboardStateManager.applyFilters(
                  $scope.model.query,
                  container.getInput().filters
              );*/

              appState.transitions.set('query', queryStringManager.getQuery());
            }
            // triggered when dashboard embeddable container has changes, and update the appState
            handleDashboardContainerChanges(container, appState, dashboardServices);
          });
          return dashboardContainer;
        }
      });
  }
  return undefined;
};

const handleDashboardContainerChanges = (
  dashboardContainer: DashboardContainer,
  appState: DashboardAppStateContainer,
  dashboardServices: DashboardServices
) => {
  let dirty = false;
  let dirtyBecauseOfInitialStateMigration = false;
  const appStateData = appState.getState();
  const savedDashboardPanelMap: { [key: string]: SavedDashboardPanel } = {};
  const { opensearchDashboardsVersion } = dashboardServices;
  const input = dashboardContainer.getInput();
  appStateData.panels.forEach((savedDashboardPanel) => {
    if (input.panels[savedDashboardPanel.panelIndex] !== undefined) {
      savedDashboardPanelMap[savedDashboardPanel.panelIndex] = savedDashboardPanel;
    } else {
      // A panel was deleted.
      dirty = true;
    }
  });
  const convertedPanelStateMap: { [key: string]: SavedDashboardPanel } = {};
  Object.values(input.panels).forEach((panelState) => {
    if (savedDashboardPanelMap[panelState.explicitInput.id] === undefined) {
      dirty = true;
    }
    convertedPanelStateMap[panelState.explicitInput.id] = convertPanelStateToSavedDashboardPanel(
      panelState,
      opensearchDashboardsVersion
    );
    if (
      !isEqual(
        convertedPanelStateMap[panelState.explicitInput.id],
        savedDashboardPanelMap[panelState.explicitInput.id]
      )
    ) {
      // A panel was changed
      dirty = true;
      const oldVersion = savedDashboardPanelMap[panelState.explicitInput.id]?.version;
      const newVersion = convertedPanelStateMap[panelState.explicitInput.id]?.version;
      if (oldVersion && newVersion && oldVersion !== newVersion) {
        dirtyBecauseOfInitialStateMigration = true;
      }
    }
  });
  if (dirty) {
    appState.transitions.set('panels', Object.values(convertedPanelStateMap));
    if (dirtyBecauseOfInitialStateMigration) {
      // this.saveState({ replace: true });
    }
  }
  if (input.isFullScreenMode !== appStateData.fullScreenMode) {
    appState.transitions.set('fullScreenMode', input.isFullScreenMode);
  }
  if (input.expandedPanelId !== appStateData.expandedPanelId) {
    appState.transitions.set('expandedPanelId', input.expandedPanelId);
  }
  if (!isEqual(input.query, migrateLegacyQuery(appState.get().query))) {
    appState.transitions.set('query', input.query);
  }
};
