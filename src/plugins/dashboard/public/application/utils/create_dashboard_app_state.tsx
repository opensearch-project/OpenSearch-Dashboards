/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { migrateAppState } from '../lib/migrate_app_state';
import {
  IOsdUrlStateStorage,
  createStateContainer,
  syncState,
} from '../../../../opensearch_dashboards_utils/public';
import {
  DashboardAppState,
  DashboardAppStateTransitions,
  DashboardAppStateInUrl,
  DashboardServices,
} from '../../types';
import { ViewMode } from '../../embeddable_plugin';
import { getDashboardIdFromUrl } from '../lib';
import { syncQueryStateWithUrl } from '../../../../data/public';

const APP_STATE_STORAGE_KEY = '_a';

interface Arguments {
  osdUrlStateStorage: IOsdUrlStateStorage;
  stateDefaults: DashboardAppState;
  services: DashboardServices;
  instance: any;
}

export const createDashboardGlobalAndAppState = ({
  stateDefaults,
  osdUrlStateStorage,
  services,
  instance,
}: Arguments) => {
  const urlState = osdUrlStateStorage.get<DashboardAppState>(APP_STATE_STORAGE_KEY);
  const {
    opensearchDashboardsVersion,
    usageCollection,
    history,
    data: { query },
  } = services;

  /* 
  Function migrateAppState() does two things
  1. Migrate panel before version 7.3.0 to the 7.3.0 panel structure.
     There are no changes to the panel structure after version 7.3.0 to the current 
     OpenSearch version so no need to migrate panels that are version 7.3.0 or higher
  2. Update the version number on each panel to the current version.
  */
  const initialState = migrateAppState(
    {
      ...stateDefaults,
      ...urlState,
    },
    opensearchDashboardsVersion,
    usageCollection
  );

  const pureTransitions = {
    set: (state) => (prop, value) => ({ ...state, [prop]: value }),
    setOption: (state) => (option, value) => ({
      ...state,
      options: {
        ...state.options,
        [option]: value,
      },
    }),
    setDashboard: (state) => (dashboard) => ({
      ...state,
      ...dashboard,
      options: {
        ...state.options,
        ...dashboard.options,
      },
    }),
  } as DashboardAppStateTransitions;

  const stateContainer = createStateContainer<DashboardAppState, DashboardAppStateTransitions>(
    initialState,
    pureTransitions
  );

  const { start: startStateSync, stop: stopStateSync } = syncState({
    storageKey: APP_STATE_STORAGE_KEY,
    stateContainer: {
      ...stateContainer,
      get: () => toUrlState(stateContainer.get()),
      set: (state: DashboardAppStateInUrl | null) => {
        // sync state required state container to be able to handle null
        // overriding set() so it could handle null coming from url
        if (state) {
          // Skip this update if current dashboardId in the url is different from what we have in the current instance of state manager
          // As dashboard is driven by angular at the moment, the destroy cycle happens async,
          // If the dashboardId has changed it means this instance
          // is going to be destroyed soon and we shouldn't sync state anymore,
          // as it could potentially trigger further url updates
          const currentDashboardIdInUrl = getDashboardIdFromUrl(history.location.pathname);
          if (currentDashboardIdInUrl !== instance.id) return;

          stateContainer.set({
            ...stateDefaults,
            ...state,
          });
        } else {
          // Do nothing in case when state from url is empty,
          // this fixes: https://github.com/elastic/kibana/issues/57789
          // There are not much cases when state in url could become empty:
          // 1. User manually removed `_a` from the url
          // 2. Browser is navigating away from the page and most likely there is no `_a` in the url.
          //    In this case we don't want to do any state updates
          //    and just allow $scope.$on('destroy') fire later and clean up everything
        }
      },
    },
    stateStorage: osdUrlStateStorage,
  });

  // starts syncing `_g` portion of url with query services
  // it is important to start this syncing after we set the time filter if timeRestore = true
  // otherwise it will case redundant browser history records and browser navigation like going back will not work correctly
  const { stop: stopSyncingQueryServiceStateWithUrl } = syncQueryStateWithUrl(
    query,
    osdUrlStateStorage
  );

  /*
     make sure url ('_a') matches initial state
     Initializing appState does two things - first it translates the defaults into AppState,
     second it updates appState based on the url (the url trumps the defaults). This means if
     we update the state format at all and want to handle BWC, we must not only migrate the
     data stored with saved vis, but also any old state in the url.
   */
  const updateStateUrl = ({ state, replace }: { state: DashboardAppState; replace: boolean }) => {
    osdUrlStateStorage.set(APP_STATE_STORAGE_KEY, toUrlState(state), { replace });
    // immediately forces scheduled updates and changes location
    return osdUrlStateStorage.flush({ replace });
  };

  updateStateUrl({ state: initialState, replace: true });

  // start syncing the appState with the ('_a') url
  startStateSync();
  return { stateContainer, stopStateSync, updateStateUrl, stopSyncingQueryServiceStateWithUrl };
};

const toUrlState = (state: DashboardAppState): DashboardAppStateInUrl => {
  if (state.viewMode === ViewMode.VIEW) {
    const { panels, ...stateWithoutPanels } = state;
    return stateWithoutPanels;
  }
  return state;
};

export const updateStateUrl = ({
  osdUrlStateStorage,
  state,
  replace,
}: {
  osdUrlStateStorage: IOsdUrlStateStorage;
  state: DashboardAppState;
  replace: boolean;
}) => {
  osdUrlStateStorage.set(APP_STATE_STORAGE_KEY, toUrlState(state), { replace });
  // immediately forces scheduled updates and changes location
  return osdUrlStateStorage.flush({ replace });
};
