/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RootState } from '../store';
import { ResultStatus } from '../types';

/**
 * Persists Redux state to URL
 * This function is called after each state change
 */
export const persistReduxState = (state: RootState, services: any) => {
  if (state.ui.transaction?.inProgress) return;
  try {
    // Sync up _q (Query state) to URL state
    services.osdUrlStateStorage.set('_q', state.query, { replace: true });

    // Sync up _a (Application state) to URL state
    services.osdUrlStateStorage.set(
      '_a',
      {
        ui: state.ui,
        tab: state.tab,
        legacy: state.legacy,
      },
      { replace: true }
    );
  } catch (err) {
    return;
  }
};

/**
 * Loads Redux state from URL or returns default state
 */
export const loadReduxState = async (services: any): Promise<any> => {
  try {
    // Use the osdUrlStateStorage from services
    if (!services.osdUrlStateStorage) {
      return await getPreloadedState(services);
    }

    // Get URL state
    const queryState = services.osdUrlStateStorage.get('_q');
    const appState = services.osdUrlStateStorage.get('_a');

    // Query state handling
    let finalQueryState;
    if (queryState && queryState.dataset) {
      finalQueryState = queryState;
    } else {
      finalQueryState = await getPreloadedQueryState(services);
    }
    services.data.query.queryString.setQuery(finalQueryState);

    // Only run preload functions for missing sections
    const finalUIState = appState?.ui || (await getPreloadedUIState(services));
    const finalResultsState = appState?.results || (await getPreloadedResultsState(services));
    const finalTabState = appState?.tab || (await getPreloadedTabState(services));
    const finalLegacyState = appState?.legacy || (await getPreloadedLegacyState(services));

    const finalState = {
      query: finalQueryState,
      ui: finalUIState,
      results: finalResultsState,
      tab: finalTabState,
      legacy: finalLegacyState,
    };

    return finalState;
  } catch (err) {
    return await getPreloadedState(services); // Fallback to full preload
  }
};

/**
 * Get preloaded state for each slice (following vis_builder pattern)
 * NOW INCLUDES DATASET INITIALIZATION via getPreloadedQueryState
 */
export const getPreloadedState = async (services: any): Promise<any> => {
  const queryState = await getPreloadedQueryState(services); // NOW includes dataset initialization
  const uiState = await getPreloadedUIState(services);
  const resultsState = await getPreloadedResultsState(services);
  const tabState = await getPreloadedTabState(services);
  const legacyState = await getPreloadedLegacyState(services);

  return {
    query: queryState, // Contains dataset, query, and language
    ui: uiState,
    results: resultsState,
    tab: tabState,
    legacy: legacyState,
  };
};

/**
 * Get preloaded query state with dataset initialization
 * Uses the same approach as DatasetSelector to get default dataset
 */
const getPreloadedQueryState = async (services: any) => {
  // First, try to get dataset from QueryStringManager (same as ConnectedDatasetSelector)
  const queryStringQuery = services.data?.query?.queryString?.getQuery();
  const defaultQuery = services.data?.query?.queryString?.getDefaultQuery();

  let selectedDataset = queryStringQuery?.dataset || defaultQuery?.dataset;

  // If no dataset found, fetch available datasets and select first one (same as DatasetSelector)
  if (!selectedDataset) {
    try {
      const datasetService = services.data?.query?.queryString?.getDatasetService();
      if (datasetService) {
        const typeConfig = datasetService.getType('INDEX_PATTERN'); // DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
        if (typeConfig) {
          const fetchedIndexPatternDataStructures = await typeConfig.fetch(services, []);
          const fetchedDatasets =
            fetchedIndexPatternDataStructures.children?.map((pattern: any) =>
              typeConfig.toDataset([pattern])
            ) ?? [];

          if (fetchedDatasets.length > 0) {
            selectedDataset = fetchedDatasets[0];
          }
        }
      }
    } catch (error) {
      // Ignore errors when parsing URL state
    }
  }

  // If we have a dataset, generate query with PPL language
  if (selectedDataset) {
    // Currently set default language to PPL for explore
    const datasetWithPPL = { ...selectedDataset, language: 'PPL' };
    const queryWithDefaults = services.data.query.queryString.getInitialQueryByDataset(
      datasetWithPPL
    );

    return queryWithDefaults;
  } else {
    return {
      query: '',
      language: 'PPL',
      dataset: undefined,
    };
  }
};

/**
 * Get preloaded UI state
 */
const getPreloadedUIState = async (services: any) => {
  return {
    activeTabId: 'logs',
    status: ResultStatus.UNINITIALIZED,
    error: null,
    abortController: null,
    transaction: {
      inProgress: false,
      pendingActions: [],
    },
  };
};

/**
 * Get preloaded results state (empty - not persisted)
 */
const getPreloadedResultsState = async (services: any) => {
  return {};
};

/**
 * Get preloaded tab state
 */
const getPreloadedTabState = async (services: any) => {
  return {};
};

/**
 * Get preloaded legacy state (vis_builder approach - defaults only, no saved object loading)
 */
const getPreloadedLegacyState = async (services: any) => {
  // Only return defaults - NO saved object loading (like vis_builder)
  const defaultColumns = services.uiSettings?.get('defaultColumns') || ['_source'];

  return {
    // Fields that exist in data_explorer + discover
    // TODO: load saved explore by id
    savedSearch: undefined, // Matches discover format - string ID, not object
    columns: defaultColumns,
    sort: [],
    isDirty: false,
    savedQuery: undefined,
    lineCount: undefined, // Flattened from metadata.lineCount

    // Fields specific to explore (not in data_explorer + discover)
    interval: 'auto',
  };
};
