/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RootState } from '../store';
import { AppState, QueryExecutionStatus } from '../types';
import { ExploreServices } from '../../../../types';
import {
  LegacyState,
  QueryEditorSliceState,
  QueryState,
  ResultsState,
  TabState,
  UIState,
} from '../slices';
import { Dataset, DataStructure } from '../../../../../../data/common';
import { DatasetTypeConfig, IDataPluginServices } from '../../../../../../data/public';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../../common';
import { defaultMetricChartStyles } from '../../../../components/visualizations/metric/metric_vis_config';
import { getPromptModeIsAvailable } from '../../get_prompt_mode_is_available';
import { DEFAULT_EDITOR_MODE } from '../constants';

/**
 * Persists Redux state to URL
 */
export const persistReduxState = (state: RootState, services: ExploreServices) => {
  if (!services.osdUrlStateStorage) return;
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
export const loadReduxState = async (services: ExploreServices): Promise<RootState> => {
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
      // The dataset from URL should already be minimal, but ensure it only has the necessary properties
      finalQueryState = {
        ...queryState,
        dataset: queryState.dataset
          ? {
              id: queryState.dataset.id,
              title: queryState.dataset.title,
              type: queryState.dataset.type,
              timeFieldName: queryState.dataset.timeFieldName,
              // Map dataSource if it exists
              dataSource: queryState.dataset.dataSource,
            }
          : undefined,
      };
    } else {
      finalQueryState = await getPreloadedQueryState(services);
    }
    services.data.query.queryString.setQuery(finalQueryState);
    const timefilter = services?.data?.query?.timefilter?.timefilter;
    if (timefilter) {
      services.data.query.queryString.addToQueryHistory(finalQueryState, timefilter.getTime());
    }

    // Only run preload functions for missing sections
    const finalUIState = appState?.ui || getPreloadedUIState(services);
    const finalResultsState = appState?.results || getPreloadedResultsState(services);
    const finalTabState = appState?.tab || getPreloadedTabState(services);
    const finalLegacyState = appState?.legacy || getPreloadedLegacyState(services);
    const finalQueryEditorState = await getPreloadedQueryEditorState(services, finalQueryState);

    return {
      query: finalQueryState,
      ui: finalUIState,
      results: finalResultsState,
      tab: finalTabState,
      legacy: finalLegacyState,
      queryEditor: finalQueryEditorState,
    };
  } catch (err) {
    return await getPreloadedState(services); // Fallback to full preload
  }
};

/**
 * Get preloaded state for each slice
 */
export const getPreloadedState = async (services: ExploreServices): Promise<RootState> => {
  const queryState = await getPreloadedQueryState(services);
  const uiState = getPreloadedUIState(services);
  const resultsState = getPreloadedResultsState(services);
  const tabState = getPreloadedTabState(services);
  const legacyState = getPreloadedLegacyState(services);
  const queryEditorState = await getPreloadedQueryEditorState(services, queryState);

  return {
    query: queryState, // Contains dataset, query, and language
    ui: uiState,
    results: resultsState,
    tab: tabState,
    legacy: legacyState,
    queryEditor: queryEditorState,
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
const getPreloadedQueryState = async (services: ExploreServices): Promise<QueryState> => {
  // Resolve the dataset to use for the initial query state
  const selectedDataset = await resolveDataset(services);

  // Use toDataset method if available, otherwise extract minimal properties
  let minimalDataset: Dataset | undefined;
  if (selectedDataset) {
    // Use type assertion to check for toDataset method
    if (typeof (selectedDataset as any).toDataset === 'function') {
      minimalDataset = (selectedDataset as any).toDataset();
    } else {
      minimalDataset = {
        id: selectedDataset.id,
        title: selectedDataset.title,
        type: selectedDataset.type,
        timeFieldName: selectedDataset.timeFieldName,
        dataSource: selectedDataset.dataSource,
      };
    }
  }

  if (minimalDataset) {
    const initialQueryByDataset = services.data.query.queryString.getInitialQueryByDataset({
      ...minimalDataset,
      language: EXPLORE_DEFAULT_LANGUAGE,
    });

    // override the initial query to be an empty string
    return {
      ...initialQueryByDataset,
      query: '',
      // Ensure we use the minimal dataset
      dataset: minimalDataset,
    };
  } else {
    return {
      query: '',
      language: EXPLORE_DEFAULT_LANGUAGE,
      dataset: undefined,
    };
  }
};

/**
 * Get preloaded UI state
 */
const getPreloadedUIState = (services: ExploreServices): UIState => {
  return {
    activeTabId: '',
    showHistogram: true,
  };
};

/**
 * Get preloaded queryEditor state
 */
const getPreloadedQueryEditorState = async (
  services: ExploreServices,
  queryState?: QueryState
): Promise<QueryEditorSliceState> => {
  let promptModeIsAvailable = false;
  if (queryState?.dataset) {
    promptModeIsAvailable = await getPromptModeIsAvailable(services);
  }

  return {
    queryStatusMap: {},
    overallQueryStatus: {
      status: QueryExecutionStatus.UNINITIALIZED,
      elapsedMs: undefined,
      startTime: undefined,
      error: undefined,
    },
    promptModeIsAvailable,
    promptToQueryIsLoading: false,
    editorMode: DEFAULT_EDITOR_MODE,
    lastExecutedTranslatedQuery: '',
    lastExecutedPrompt: '',
  };
};

/**
 * Get preloaded results state (empty - not persisted)
 */
const getPreloadedResultsState = (services: ExploreServices): ResultsState => {
  return {};
};

/**
 * Get preloaded tab state
 */
const getPreloadedTabState = (services: ExploreServices): TabState => {
  return {
    logs: {},
    visualizations: {
      styleOptions: defaultMetricChartStyles,
      chartType: undefined,
      axesMapping: {},
    },
  };
};

/**
 * Get preloaded legacy state (vis_builder approach - defaults only, no saved object loading)
 */
const getPreloadedLegacyState = (services: ExploreServices): LegacyState => {
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
