/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHashHistory } from 'history';
import {
  createStateContainer,
  syncState,
  createOsdUrlStateStorage,
} from '../../../../opensearch_dashboards_utils/public';

interface IEditDatasetState {
  tab: string;
}

/**
 * Create state container with sync config for tab navigation specific for edit_dataset page
 */
export function createEditDatasetPageStateContainer({
  defaultTab,
  useHashedUrl,
}: {
  defaultTab: string;
  useHashedUrl: boolean;
}) {
  const history = createHashHistory();
  // query param to store app state at
  const stateStorageKey = '_a';
  // default app state, when there is no initial state in the url
  const defaultState = {
    tab: defaultTab,
  };
  const osdUrlStateStorage = createOsdUrlStateStorage({
    useHash: useHashedUrl,
    history,
  });
  // extract starting app state from URL and use it as starting app state in state container
  const initialStateFromUrl = osdUrlStateStorage.get<IEditDatasetState>(stateStorageKey);
  const stateContainer = createStateContainer(
    {
      ...defaultState,
      ...initialStateFromUrl,
    },
    {
      setTab: (state: IEditDatasetState) => (tab: string) => ({ ...state, tab }),
    },
    {
      tab: (state: IEditDatasetState) => () => state.tab,
    }
  );

  const { start, stop } = syncState({
    storageKey: stateStorageKey,
    stateContainer: {
      ...stateContainer,
      // state syncing utility requires state containers to handle "null"
      set: (state) => state && stateContainer.set(state),
    },
    stateStorage: osdUrlStateStorage,
  });

  // makes sure initial url is the same as initial state (this is not really required)
  osdUrlStateStorage.set(stateStorageKey, stateContainer.getState(), { replace: true });

  return {
    startSyncingState: start,
    stopSyncingState: stop,
    setCurrentTab: (newTab: string) => stateContainer.transitions.setTab(newTab),
    getCurrentTab: () => stateContainer.selectors.tab(),
  };
}
