/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  configureStore,
  combineReducers,
  createAction,
  PreloadedState,
  AnyAction,
  Reducer,
} from '@reduxjs/toolkit';
import { isEqual } from 'lodash';
import {
  queryReducer,
  uiReducer,
  resultsReducer,
  tabReducer,
  legacyReducer,
  queryEditorReducer,
  metaReducer,
} from './slices';
import { loadReduxState } from './utils/redux_persistence';
import { normalizeStateForComparison } from './utils/state_comparison';
import { setIsInitialized, setDateRange } from './slices';
import { createQuerySyncMiddleware } from './middleware/query_sync_middleware';
import { createTimefilterSyncMiddleware } from './middleware/timefilter_sync_middleware';
import { createPersistenceMiddleware } from './middleware/persistence_middleware';
import { createOverallStatusMiddleware } from './middleware/overall_status_middleware';
import { createDatasetChangeMiddleware } from './middleware/dataset_change_middleware';
import { ExploreServices } from '../../../types';

const resetState = createAction<RootState>('app/resetState');
const hydrateState = createAction<RootState>('app/hydrateState');

const baseRootReducer = combineReducers({
  query: queryReducer,
  ui: uiReducer,
  results: resultsReducer,
  tab: tabReducer,
  legacy: legacyReducer,
  queryEditor: queryEditorReducer,
  meta: metaReducer,
});

export const rootReducer: Reducer<RootState, AnyAction> = (state, action) => {
  if (resetState.match(action)) {
    return action.payload;
  }
  if (hydrateState.match(action)) {
    return action.payload;
  }
  return baseRootReducer(state, action);
};

export type RootState = ReturnType<typeof baseRootReducer>;
export type AppStore = ReturnType<typeof configurePreloadedStore>;
export type AppDispatch = AppStore['dispatch'];

export const configurePreloadedStore = (
  preloadedState: PreloadedState<RootState>,
  services?: ExploreServices
) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      services
        ? getDefaultMiddleware()
            .concat(createPersistenceMiddleware(services))
            .concat(createQuerySyncMiddleware(services))
            .concat(createTimefilterSyncMiddleware(services))
            .concat(createDatasetChangeMiddleware(services))
            .concat(createOverallStatusMiddleware())
        : getDefaultMiddleware(),
  });
};

export const getPreloadedStore = async (services: ExploreServices) => {
  try {
    const preloadedState = await loadReduxState(services);
    const store = configurePreloadedStore(preloadedState, services);
    const initialState = store.getState();
    const reset = () => store.dispatch(resetState(initialState));

    // Listen to browser history changes to sync URL state back to Redux
    const historyUnsubscribe = services.scopedHistory?.listen(async (location, historyAction) => {
      // Only handle POP actions (back/forward and manual URL edits)
      if (historyAction === 'REPLACE' || historyAction === 'PUSH') {
        return;
      }

      try {
        // Gets current URL state during navigation for comparison
        const urlAppState = await loadReduxState(services);
        const currentAppState = store.getState();

        // Extract _g time range from URL and update Redux dateRange
        const urlGlobalState = services.osdUrlStateStorage?.get('_g') as {
          time?: { from: string; to: string };
        } | null;
        let dateRangeChanged = false;
        if (urlGlobalState?.time) {
          const currentDateRange = currentAppState.queryEditor.dateRange;
          if (!isEqual(urlGlobalState.time, currentDateRange)) {
            store.dispatch(setDateRange(urlGlobalState.time));
            dateRangeChanged = true;
          }
        }

        // Extract and normalize only the persistable parts for comparison
        const normalizedUrlState = normalizeStateForComparison(urlAppState);
        const normalizedCurrentState = normalizeStateForComparison(currentAppState);

        // Check if app state has changed (excluding dateRange which is handled separately)
        const appStateChanged = !isEqual(normalizedUrlState, normalizedCurrentState);

        // Update Redux state if URL state is different
        if (dateRangeChanged || appStateChanged) {
          // TODO: Optimize this to limit to only query and global state changes
          store.dispatch(setIsInitialized(false));
          // Only hydrate app state if it actually changed
          if (appStateChanged) {
            store.dispatch(hydrateState(urlAppState));
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to sync URL state to Redux:', error);
      }
    });

    const unsubscribe = () => {
      if (historyUnsubscribe) {
        historyUnsubscribe();
      }
    };

    return { store, unsubscribe, reset };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize preloaded store:', error);
    const store = configurePreloadedStore({} as any, services);
    const initialState = store.getState();
    const reset = () => store.dispatch(resetState(initialState));

    return {
      store,
      unsubscribe: () => {},
      reset,
    };
  }
};
