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
import _ from 'lodash';
import { IndexPattern, opensearchFilters } from '../../../../../data/public';
import {
  DASHBOARD_CONTAINER_TYPE,
  DashboardContainer,
  DashboardContainerInput,
  DashboardPanelState,
} from '../../embeddable';
import {
  ContainerOutput,
  EmbeddableFactoryNotFoundError,
  EmbeddableInput,
  ErrorEmbeddable,
  ViewMode,
  isErrorEmbeddable,
  openAddPanelFlyout,
} from '../../../embeddable_plugin';
import {
  convertPanelStateToSavedDashboardPanel,
  convertSavedDashboardPanelToPanelState,
} from '../../lib/embeddable_saved_object_converters';
import { DashboardEmptyScreen, DashboardEmptyScreenProps } from '../../dashboard_empty_screen';
import {
  DashboardAppState,
  DashboardAppStateContainer,
  DashboardServices,
  SavedDashboardPanel,
} from '../../../types';
import { migrateLegacyQuery } from '../../lib/migrate_legacy_query';
import { getSavedObjectFinder } from '../../../../../saved_objects/public';
import { DashboardConstants } from '../../../dashboard_constants';
import { SavedObjectDashboard } from '../../../saved_dashboards';
import { Dashboard } from '../../../dashboard';

export const useDashboardContainer = (
  services: DashboardServices,
  isChromeVisible: boolean,
  eventEmitter: EventEmitter,
  dashboard?: Dashboard,
  savedDashboardInstance?: SavedObjectDashboard,
  appState?: DashboardAppStateContainer
) => {
  const [dashboardContainer, setDashboardContainer] = useState<DashboardContainer>();

  useEffect(() => {
    const getDashboardContainer = async () => {
      try {
        if (savedDashboardInstance && appState && dashboard) {
          const dashboardContainerEmbeddable = await createDashboardEmbeddable(
            savedDashboardInstance,
            services,
            appState,
            dashboard
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
  }, [savedDashboardInstance, appState, services, dashboard]);

  useEffect(() => {
    const incomingEmbeddable = services.embeddable
      .getStateTransfer(services.scopedHistory)
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
  appState: DashboardAppStateContainer,
  dashboard: Dashboard
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
    notifications,
    overlays,
    savedObjects,
  } = dashboardServices;
  const { query: queryService } = data;
  const filterManager = queryService.filterManager;
  const timefilter = queryService.timefilter.timefilter;
  const queryStringManager = queryService.queryString;
  const { visualizeCapabilities, mapsCapabilities } = embeddableCapabilities;
  const dashboardFactory = embeddable.getEmbeddableFactory<
    DashboardContainerInput,
    ContainerOutput,
    DashboardContainer
  >(DASHBOARD_CONTAINER_TYPE);

  const getShouldShowEditHelp = (appStateData: DashboardAppState) => {
    return (
      !appStateData.panels.length &&
      appStateData.viewMode === ViewMode.EDIT &&
      !dashboardConfig.getHideWriteControls()
    );
  };

  const getShouldShowViewHelp = (appStateData: DashboardAppState) => {
    return (
      !appStateData.panels.length &&
      appStateData.viewMode === ViewMode.VIEW &&
      !dashboardConfig.getHideWriteControls()
    );
  };

  const shouldShowUnauthorizedEmptyState = (appStateData: DashboardAppState) => {
    const readonlyMode =
      !appStateData.panels.length &&
      !getShouldShowEditHelp(appStateData) &&
      !getShouldShowViewHelp(appStateData) &&
      dashboardConfig.getHideWriteControls();
    const userHasNoPermissions =
      !appStateData.panels.length && !visualizeCapabilities.save && !mapsCapabilities.save;
    return readonlyMode || userHasNoPermissions;
  };

  const getEmptyScreenProps = (
    shouldShowEditHelp: boolean,
    isEmptyInReadOnlyMode: boolean,
    stateContainer: DashboardAppStateContainer
  ): DashboardEmptyScreenProps => {
    const emptyScreenProps: DashboardEmptyScreenProps = {
      onLinkClick: () => {
        if (shouldShowEditHelp) {
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
        } else {
          stateContainer.transitions.set('viewMode', ViewMode.EDIT);
        }
      },
      showLinkToVisualize: shouldShowEditHelp,
      uiSettings,
      http,
    };
    if (shouldShowEditHelp) {
      emptyScreenProps.onVisualizeClick = async () => {
        const type = 'visualization';
        const factory = embeddable.getEmbeddableFactory(type);
        if (!factory) {
          throw new EmbeddableFactoryNotFoundError(type);
        }
        await factory.create({} as EmbeddableInput, dashboardContainer);
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
      isEmptyState:
        getShouldShowEditHelp(appStateData) ||
        getShouldShowViewHelp(appStateData) ||
        shouldShowUnauthorizedEmptyState(appStateData),
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
            const appStateData = appState.getState();
            const shouldShowEditHelp = getShouldShowEditHelp(appStateData);
            const shouldShowViewHelp = getShouldShowViewHelp(appStateData);
            const isEmptyInReadOnlyMode = shouldShowUnauthorizedEmptyState(appStateData);
            const isEmptyState = shouldShowEditHelp || shouldShowViewHelp || isEmptyInReadOnlyMode;
            return isEmptyState ? (
              <DashboardEmptyScreen
                {...getEmptyScreenProps(shouldShowEditHelp, isEmptyInReadOnlyMode, appState)}
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
            handleDashboardContainerChanges(container, appState, dashboardServices, dashboard);
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
  dashboardServices: DashboardServices,
  dashboard: Dashboard
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
    if (!dirtyBecauseOfInitialStateMigration) {
      appState.transitions.set('isDirty', true);
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
