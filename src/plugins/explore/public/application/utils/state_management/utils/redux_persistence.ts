/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RootState } from '../store';
import { ResultStatus, AppState } from '../types';
import { ExploreServices } from '../../../../types';
import { QueryState } from '../slices/query_slice';
import { Dataset, DataStructure } from '../../../../../../data/common';
import { DatasetTypeConfig, IDataPluginServices } from '../../../../../../data/public';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../../common';

/**
 * Persists Redux state to URL
 */
export const persistReduxState = (state: RootState, services: ExploreServices) => {
  if (state.ui.transaction?.inProgress || !services.osdUrlStateStorage) return;
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
export const loadReduxState = async (services: ExploreServices): Promise<any> => {
  try {
    // Use the osdUrlStateStorage from services
    if (!services.osdUrlStateStorage) {
      return await getPreloadedState(services);
    }

    // Get URL state
    const queryState = services.osdUrlStateStorage.get('_q') as QueryState | null;
    const appState = services.osdUrlStateStorage.get('_a') as AppState | null;

    // Query state handling
    let finalQueryState: QueryState;
    if (queryState?.dataset) {
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
 * Get preloaded state for each slice
 */
export const getPreloadedState = async (services: ExploreServices): Promise<any> => {
  const queryState = await getPreloadedQueryState(services);
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
 * Fetches the first available dataset using the data plugin's dataset service
 */
const fetchFirstAvailableDataset = async (
  services: ExploreServices
): Promise<Dataset | undefined> => {
  try {
    const datasetService = services.data?.query?.queryString?.getDatasetService();
    if (!datasetService) {
      return undefined;
    }

    const typeConfig: DatasetTypeConfig | undefined = datasetService.getType('INDEX_PATTERN');
    if (!typeConfig) {
      return undefined;
    }

    const dataPluginServices: IDataPluginServices = {
      ...services,
      storage: services.storage as any,
    };

    const fetchedIndexPatternDataStructures: DataStructure = await typeConfig.fetch(
      dataPluginServices,
      []
    );
    const fetchedDatasets: Dataset[] =
      fetchedIndexPatternDataStructures.children?.map((pattern: DataStructure) =>
        typeConfig.toDataset([pattern])
      ) ?? [];

    return fetchedDatasets.length > 0 ? fetchedDatasets[0] : undefined;
  } catch (error) {
    return undefined;
  }
};

/**
 * Resolves the dataset to use for the initial query state
 */
const resolveDataset = async (services: ExploreServices): Promise<Dataset | undefined> => {
  // First, try to get dataset from QueryStringManager (same as ConnectedDatasetSelector)
  const queryStringQuery = services.data?.query?.queryString?.getQuery();
  const defaultQuery = services.data?.query?.queryString?.getDefaultQuery();

  let selectedDataset = queryStringQuery?.dataset || defaultQuery?.dataset;

  // If no dataset found, fetch available datasets and select first one (same as DatasetSelector)
  if (!selectedDataset) {
    selectedDataset = await fetchFirstAvailableDataset(services);
  }

  return selectedDataset;
};

/**
 * Get preloaded query state with dataset initialization
 */
const getPreloadedQueryState = async (services: ExploreServices) => {
  // Resolve the dataset to use for the initial query state
  const selectedDataset = await resolveDataset(services);

  if (selectedDataset) {
    return services.data.query.queryString.getInitialQueryByDataset({
      ...selectedDataset,
      language: EXPLORE_DEFAULT_LANGUAGE,
    });
  } else {
    return {
      query: '',
      language: EXPLORE_DEFAULT_LANGUAGE,
      dataset: selectedDataset,
    };
  }
};

/**
 * Get preloaded UI state
 */
const getPreloadedUIState = async (services: ExploreServices) => {
  return {
    activeTabId: 'logs',
    status: ResultStatus.UNINITIALIZED,
    error: null,
    abortController: null,
    styleOptions: {},
    transaction: {
      inProgress: false,
      pendingActions: [],
    },
  };
};

/**
 * Get preloaded results state (empty - not persisted)
 */
const getPreloadedResultsState = async (services: ExploreServices) => {
  return {};
};

/**
 * Get preloaded tab state
 */
const getPreloadedTabState = async (services: ExploreServices) => {
  return {};
};

/**
 * Get preloaded legacy state (vis_builder approach - defaults only, no saved object loading)
 */
const getPreloadedLegacyState = async (services: ExploreServices) => {
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
