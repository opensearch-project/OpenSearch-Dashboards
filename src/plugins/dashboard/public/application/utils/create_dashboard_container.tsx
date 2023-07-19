/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cloneDeep, isEqual, uniqBy } from 'lodash';
import { i18n } from '@osd/i18n';
import { EMPTY, Observable, Subscription, merge, pipe } from 'rxjs';
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

import { IndexPattern, opensearchFilters } from '../../../../data/public';
import {
  DASHBOARD_CONTAINER_TYPE,
  DashboardContainer,
  DashboardContainerInput,
  DashboardPanelState,
  DashboardEmptyScreen,
  DashboardEmptyScreenProps,
} from '../embeddable';
import {
  ContainerOutput,
  EmbeddableFactoryNotFoundError,
  EmbeddableInput,
  ViewMode,
  isErrorEmbeddable,
  openAddPanelFlyout,
} from '../../../../embeddable/public';
import {
  convertPanelStateToSavedDashboardPanel,
  convertSavedDashboardPanelToPanelState,
} from '../utils/embeddable_saved_object_converters';
import {
  DashboardAppState,
  DashboardAppStateContainer,
  DashboardServices,
  SavedDashboardPanel,
} from '../../types';
import { getSavedObjectFinder } from '../../../../saved_objects/public';
import { DashboardConstants } from '../../dashboard_constants';
import { SavedObjectDashboard } from '../../saved_dashboards';
import { migrateLegacyQuery } from '../utils/migrate_legacy_query';
import { Dashboard } from '../../dashboard';

export const createDashboardContainer = async ({
  services,
  savedDashboard,
  appState,
}: {
  services: DashboardServices;
  savedDashboard?: SavedObjectDashboard;
  appState?: DashboardAppStateContainer;
}) => {
  const { embeddable } = services;

  const dashboardFactory = embeddable.getEmbeddableFactory<
    DashboardContainerInput,
    ContainerOutput,
    DashboardContainer
  >(DASHBOARD_CONTAINER_TYPE);

  if (!dashboardFactory) {
    throw new EmbeddableFactoryNotFoundError('dashboard');
  }

  try {
    if (appState) {
      const appStateData = appState.getState();
      const initialInput = getDashboardInputFromAppState(
        appStateData,
        services,
        savedDashboard?.id
      );

      const incomingEmbeddable = services.embeddable
        .getStateTransfer(services.scopedHistory)
        .getIncomingEmbeddablePackage();

      if (
        incomingEmbeddable?.embeddableId &&
        initialInput.panels[incomingEmbeddable.embeddableId]
      ) {
        const initialPanelState = initialInput.panels[incomingEmbeddable.embeddableId];
        initialInput.panels = {
          ...initialInput.panels,
          [incomingEmbeddable.embeddableId]: {
            gridData: initialPanelState.gridData,
            type: incomingEmbeddable.type,
            explicitInput: {
              ...initialPanelState.explicitInput,
              ...incomingEmbeddable.input,
              id: incomingEmbeddable.embeddableId,
            },
          },
        };
      }
      const dashboardContainerEmbeddable = await dashboardFactory.create(initialInput);

      if (!dashboardContainerEmbeddable || isErrorEmbeddable(dashboardContainerEmbeddable)) {
        dashboardContainerEmbeddable?.destroy();
        return undefined;
      }
      if (
        incomingEmbeddable &&
        !dashboardContainerEmbeddable?.getInput().panels[incomingEmbeddable.embeddableId!]
      ) {
        dashboardContainerEmbeddable?.addNewEmbeddable<EmbeddableInput>(
          incomingEmbeddable.type,
          incomingEmbeddable.input
        );
      }

      return dashboardContainerEmbeddable;
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

export const handleDashboardContainerInputs = (
  services: DashboardServices,
  dashboardContainer: DashboardContainer,
  appState: DashboardAppStateContainer,
  dashboard: Dashboard
) => {
  // This has to be first because handleDashboardContainerChanges causes
  // appState.save which will cause refreshDashboardContainer to be called.
  const subscriptions = new Subscription();
  const { filterManager, queryString } = services.data.query;

  const inputSubscription = dashboardContainer.getInput$().subscribe(() => {
    if (
      !opensearchFilters.compareFilters(
        dashboardContainer.getInput().filters,
        filterManager.getFilters(),
        opensearchFilters.COMPARE_ALL_OPTIONS
      )
    ) {
      // Add filters modifies the object passed to it, hence the clone deep.
      filterManager.addFilters(cloneDeep(dashboardContainer.getInput().filters));
      appState.transitions.set('query', queryString.getQuery());
    }
    // triggered when dashboard embeddable container has changes, and update the appState
    handleDashboardContainerChanges(dashboardContainer, appState, services, dashboard);
  });

  subscriptions.add(inputSubscription);

  return () => subscriptions.unsubscribe();
};

export const handleDashboardContainerOutputs = (
  services: DashboardServices,
  dashboardContainer: DashboardContainer,
  setIndexPatterns: React.Dispatch<React.SetStateAction<IndexPattern[]>>
) => {
  const subscriptions = new Subscription();

  const { indexPatterns } = services.data;

  const updateIndexPatternsOperator = pipe(
    filter((container: DashboardContainer) => !!container && !isErrorEmbeddable(container)),
    map(setCurrentIndexPatterns),
    distinctUntilChanged((a, b) =>
      deepEqual(
        a.map((ip) => ip.id),
        b.map((ip) => ip.id)
      )
    ),
    // using switchMap for previous task cancellation
    switchMap((panelIndexPatterns: IndexPattern[]) => {
      return new Observable((observer) => {
        if (panelIndexPatterns && panelIndexPatterns.length > 0) {
          if (observer.closed) return;
          setIndexPatterns(panelIndexPatterns);
          observer.complete();
        } else {
          indexPatterns.getDefault().then((defaultIndexPattern) => {
            if (observer.closed) return;
            setIndexPatterns([defaultIndexPattern as IndexPattern]);
            observer.complete();
          });
        }
      });
    })
  );

  const outputSubscription = merge(
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
      updateIndexPatternsOperator
    )
    .subscribe();

  subscriptions.add(outputSubscription);

  return () => subscriptions.unsubscribe();
};

const getShouldShowEditHelp = (appStateData: DashboardAppState, dashboardConfig: any) => {
  return (
    !appStateData.panels.length &&
    appStateData.viewMode === ViewMode.EDIT &&
    !dashboardConfig.getHideWriteControls()
  );
};

const getShouldShowViewHelp = (appStateData: DashboardAppState, dashboardConfig: any) => {
  return (
    !appStateData.panels.length &&
    appStateData.viewMode === ViewMode.VIEW &&
    !dashboardConfig.getHideWriteControls()
  );
};

const shouldShowUnauthorizedEmptyState = (
  appStateData: DashboardAppState,
  services: DashboardServices
) => {
  const { dashboardConfig, embeddableCapabilities } = services;
  const { visualizeCapabilities, mapsCapabilities } = embeddableCapabilities;

  const readonlyMode =
    !appStateData.panels.length &&
    !getShouldShowEditHelp(appStateData, dashboardConfig) &&
    !getShouldShowViewHelp(appStateData, dashboardConfig) &&
    dashboardConfig.getHideWriteControls();
  const userHasNoPermissions =
    !appStateData.panels.length && !visualizeCapabilities.save && !mapsCapabilities.save;
  return readonlyMode || userHasNoPermissions;
};

const getEmptyScreenProps = (
  shouldShowEditHelp: boolean,
  isEmptyInReadOnlyMode: boolean,
  stateContainer: DashboardAppStateContainer,
  container: DashboardContainer,
  services: DashboardServices
): DashboardEmptyScreenProps => {
  const { embeddable, uiSettings, http, notifications, overlays, savedObjects } = services;
  const emptyScreenProps: DashboardEmptyScreenProps = {
    onLinkClick: () => {
      if (shouldShowEditHelp) {
        if (container && !isErrorEmbeddable(container)) {
          openAddPanelFlyout({
            embeddable: container,
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
      await factory.create({} as EmbeddableInput, container);
    };
  }
  if (isEmptyInReadOnlyMode) {
    emptyScreenProps.isReadonlyMode = true;
  }
  return emptyScreenProps;
};

export const renderEmpty = (
  container: DashboardContainer,
  appState: DashboardAppStateContainer,
  services: DashboardServices
) => {
  const { dashboardConfig } = services;
  const appStateData = appState.getState();
  const shouldShowEditHelp = getShouldShowEditHelp(appStateData, dashboardConfig);
  const shouldShowViewHelp = getShouldShowViewHelp(appStateData, dashboardConfig);
  const isEmptyInReadOnlyMode = shouldShowUnauthorizedEmptyState(appStateData, services);
  const isEmptyState = shouldShowEditHelp || shouldShowViewHelp || isEmptyInReadOnlyMode;
  return isEmptyState ? (
    <DashboardEmptyScreen
      {...getEmptyScreenProps(
        shouldShowEditHelp,
        isEmptyInReadOnlyMode,
        appState,
        container,
        services
      )}
    />
  ) : null;
};

const setCurrentIndexPatterns = (dashboardContainer: DashboardContainer) => {
  let panelIndexPatterns: IndexPattern[] = [];
  dashboardContainer.getChildIds().forEach((id) => {
    const embeddableInstance = dashboardContainer.getChild(id);
    if (isErrorEmbeddable(embeddableInstance)) return;
    const embeddableIndexPatterns = (embeddableInstance.getOutput() as any).indexPatterns;
    if (!embeddableIndexPatterns) return;
    panelIndexPatterns.push(...embeddableIndexPatterns);
  });
  panelIndexPatterns = uniqBy(panelIndexPatterns, 'id');
  return panelIndexPatterns;
};

const getDashboardInputFromAppState = (
  appStateData: DashboardAppState,
  services: DashboardServices,
  savedDashboardId?: string
) => {
  const { data, dashboardConfig } = services;
  const embeddablesMap: {
    [key: string]: DashboardPanelState;
  } = {};
  appStateData.panels.forEach((panel: SavedDashboardPanel) => {
    embeddablesMap[panel.panelIndex] = convertSavedDashboardPanelToPanelState(panel);
  });

  const lastReloadRequestTime = 0;
  return {
    id: savedDashboardId || '',
    filters: data.query.filterManager.getFilters(),
    hidePanelTitles: appStateData.options.hidePanelTitles,
    query: data.query.queryString.getQuery(),
    timeRange: data.query.timefilter.timefilter.getTime(),
    refreshConfig: data.query.timefilter.timefilter.getRefreshInterval(),
    viewMode: appStateData.viewMode,
    panels: embeddablesMap,
    isFullScreenMode: appStateData.fullScreenMode,
    isEmptyState:
      getShouldShowEditHelp(appStateData, dashboardConfig) ||
      getShouldShowViewHelp(appStateData, dashboardConfig) ||
      shouldShowUnauthorizedEmptyState(appStateData, services),
    useMargins: appStateData.options.useMargins,
    lastReloadRequestTime,
    title: appStateData.title,
    description: appStateData.description,
    expandedPanelId: appStateData.expandedPanelId,
    timeRestore: appStateData.timeRestore,
  };
};

const getChangesForContainerStateFromAppState = (
  currentContainer: DashboardContainer,
  appStateDashboardInput: DashboardContainerInput
) => {
  if (!currentContainer || isErrorEmbeddable(currentContainer)) {
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

const handleDashboardContainerChanges = (
  dashboardContainer: DashboardContainer,
  appState: DashboardAppStateContainer,
  dashboardServices: DashboardServices,
  dashboard: Dashboard
) => {
  let dirty = false;
  let dirtyBecauseOfInitialStateMigration = false;
  if (!appState) {
    return;
  }
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
      // Do not need to care about initial migration here because the version update
      // is already handled in migrateAppState() when we create state container
      const oldVersion = savedDashboardPanelMap[panelState.explicitInput.id]?.version;
      const newVersion = convertedPanelStateMap[panelState.explicitInput.id]?.version;
      if (oldVersion && newVersion && oldVersion !== newVersion) {
        dirtyBecauseOfInitialStateMigration = true;
      }

      dirty = true;
    }
  });

  const newAppState: { [key: string]: any } = {};
  if (dirty) {
    newAppState.panels = Object.values(convertedPanelStateMap);
    if (dirtyBecauseOfInitialStateMigration) {
      dashboardContainer.updateAppStateUrl?.({ replace: true });
    } else {
      dashboard.setIsDirty(true);
    }
  }
  if (input.isFullScreenMode !== appStateData.fullScreenMode) {
    newAppState.fullScreenMode = input.isFullScreenMode;
  }
  if (input.expandedPanelId !== appStateData.expandedPanelId) {
    newAppState.expandedPanelId = input.expandedPanelId;
  }
  if (input.viewMode !== appStateData.viewMode) {
    newAppState.viewMode = input.viewMode;
  }
  if (!isEqual(input.query, migrateLegacyQuery(appStateData.query))) {
    newAppState.query = input.query;
  }

  appState.transitions.setDashboard(newAppState);

  // event emit dirty?
};

export const refreshDashboardContainer = ({
  dashboardContainer,
  dashboardServices,
  savedDashboard,
  appStateData,
}: {
  dashboardContainer: DashboardContainer;
  dashboardServices: DashboardServices;
  savedDashboard: Dashboard;
  appStateData?: DashboardAppState;
}) => {
  if (!appStateData) {
    return;
  }

  const currentDashboardInput = getDashboardInputFromAppState(
    appStateData,
    dashboardServices,
    savedDashboard.id
  );

  const changes = getChangesForContainerStateFromAppState(
    dashboardContainer,
    currentDashboardInput
  );

  if (changes) {
    dashboardContainer.updateInput(changes);

    if (changes.timeRange || changes.refreshConfig) {
      if (appStateData.timeRestore) {
        savedDashboard.setIsDirty(true);
      }
    }

    if (changes.filters || changes.query) {
      savedDashboard.setIsDirty(true);
    }
  }
};
