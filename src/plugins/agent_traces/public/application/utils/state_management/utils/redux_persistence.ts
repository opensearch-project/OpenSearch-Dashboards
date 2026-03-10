/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCurrentAppId } from '../../../../helpers/get_flavor_from_app_id';
import { RootState } from '../store';
import { AppState, QueryExecutionStatus } from '../types';
import { AgentTracesServices } from '../../../../types';
import {
  LegacyState,
  QueryEditorSliceState,
  QueryState,
  ResultsState,
  TabState,
  UIState,
} from '../slices';
import {
  Dataset,
  DataStructure,
  DEFAULT_DATA,
  CORE_SIGNAL_TYPES,
} from '../../../../../../data/common';
import { DatasetTypeConfig, IDataPluginServices } from '../../../../../../data/public';
import {
  AGENT_TRACES_DEFAULT_LANGUAGE,
  DEFAULT_TRACE_COLUMNS_SETTING,
} from '../../../../../common';
import { getPromptModeIsAvailable } from '../../get_prompt_mode_is_available';
import { getSummaryAgentIsAvailable } from '../../get_summary_agent_is_available';
import { DEFAULT_EDITOR_MODE } from '../constants';

/**
 * Persists Redux state to URL
 */
export const persistReduxState = (state: RootState, services: AgentTracesServices) => {
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
export const loadReduxState = async (services: AgentTracesServices): Promise<RootState> => {
  try {
    // Use the osdUrlStateStorage from services
    if (!services.osdUrlStateStorage) {
      return await getPreloadedState(services);
    }

    // Get URL state
    const queryState = services.osdUrlStateStorage.get('_q') as QueryState | null;
    const appState = services.osdUrlStateStorage.get('_a') as AppState | null;

    // Query state handling - always resolve dataset to ensure SignalType validation
    let urlDataset: Dataset | undefined;
    if (queryState?.dataset) {
      // Extract minimal dataset from URL state
      urlDataset = {
        id: queryState.dataset.id,
        title: queryState.dataset.title,
        type: queryState.dataset.type,
        language: queryState.dataset.language,
        timeFieldName: queryState.dataset.timeFieldName,
        dataSource: queryState.dataset.dataSource,
        signalType: queryState.dataset.signalType,
      };
    }

    // Always call getPreloadedQueryState to ensure SignalType validation runs
    const resolvedQueryState = await getPreloadedQueryState(services, urlDataset);

    // Use the resolved dataset but preserve other query state from URL if available
    // When the dataset changes (due to signal type filtering), also update the language
    const datasetChanged =
      queryState?.dataset?.id !== resolvedQueryState.dataset?.id ||
      queryState?.dataset?.type !== resolvedQueryState.dataset?.type;

    const finalQueryState: QueryState = queryState
      ? {
          ...queryState,
          dataset: resolvedQueryState.dataset,
          language: datasetChanged ? resolvedQueryState.language : queryState.language,
          query: datasetChanged ? '' : queryState.query,
        }
      : resolvedQueryState;
    services.data.query.queryString.setQuery(finalQueryState);
    const timefilter = services?.data?.query?.timefilter?.timefilter;
    if (timefilter) {
      services.data.query.queryString.addToQueryHistory(finalQueryState, timefilter.getTime());
    }

    // Only run preload functions for missing sections
    const finalUIState = appState?.ui || getPreloadedUIState(services);
    const finalResultsState = appState?.results || getPreloadedResultsState(services);
    const finalTabState = appState?.tab || getPreloadedTabState(services);

    // Handle legacy state with special logic for columns
    let finalLegacyState = appState?.legacy;
    if (!finalLegacyState || !finalLegacyState.columns || finalLegacyState.columns.length === 0) {
      // If no legacy state or columns are empty/missing, load defaults
      finalLegacyState = await getPreloadedLegacyState(services);
    } else {
      const correctedColumns = await getColumnsForDataset(services, finalLegacyState.columns);

      if (correctedColumns) {
        finalLegacyState = {
          ...finalLegacyState,
          columns: correctedColumns,
        };
      }
    }

    const finalQueryEditorState = await getPreloadedQueryEditorState(services, finalQueryState);
    const finalMetaState = appState?.meta || getPreloadedMetaState(services);

    return {
      query: finalQueryState,
      ui: finalUIState,
      results: finalResultsState,
      tab: finalTabState,
      legacy: finalLegacyState,
      queryEditor: finalQueryEditorState,
      meta: finalMetaState,
    };
  } catch (err) {
    return await getPreloadedState(services); // Fallback to full preload
  }
};

/**
 * Get preloaded state for each slice
 */
export const getPreloadedState = async (
  services: AgentTracesServices,
  preferredDataset?: Dataset
): Promise<RootState> => {
  const queryState = await getPreloadedQueryState(services, preferredDataset);
  const uiState = getPreloadedUIState(services);
  const resultsState = getPreloadedResultsState(services);
  const tabState = getPreloadedTabState(services);
  const legacyState = await getPreloadedLegacyState(services);
  const queryEditorState = await getPreloadedQueryEditorState(services, queryState);
  const metaState = getPreloadedMetaState(services);

  return {
    query: queryState,
    ui: uiState,
    results: resultsState,
    tab: tabState,
    legacy: legacyState,
    queryEditor: queryEditorState,
    meta: metaState,
  };
};

/**
 * Fetches the first available dataset using the data plugin's dataset service
 */
const fetchFirstAvailableDataset = async (
  services: AgentTracesServices,
  requiredSignalType?: string
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

    // Filter by SignalType compatibility
    if (fetchedDatasets.length > 0) {
      for (const dataset of fetchedDatasets) {
        try {
          const dataView = await services.data?.dataViews?.get(
            dataset.id,
            dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
          );

          // Get effective signal type from dataView or dataset
          const effectiveSignalType = dataView?.signalType || dataset.signalType;

          // If requiredSignalType is specified, dataset must match it
          if (requiredSignalType) {
            if (effectiveSignalType === requiredSignalType) {
              return dataset;
            }
          } else {
            // If requiredSignalType is not specified (i.e., Logs flavor),
            // dataset should not have signalType equal to Traces or Metrics
            if (
              effectiveSignalType !== CORE_SIGNAL_TYPES.TRACES &&
              effectiveSignalType !== CORE_SIGNAL_TYPES.METRICS
            ) {
              return dataset;
            }
          }
        } catch (error) {
          // Continue to next dataset if this one fails
          continue;
        }
      }
      return undefined; // No compatible dataset found
    }

    return undefined;
  } catch (error) {
    return undefined;
  }
};

/**
 * Resolves the dataset to use for the initial query state
 */
const resolveDataset = async (
  services: AgentTracesServices,
  preferredDataset?: Dataset
): Promise<Dataset | undefined> => {
  const requiredSignalType = CORE_SIGNAL_TYPES.TRACES;

  // Get existing dataset from QueryStringManager or use preferred dataset
  const queryStringQuery = services.data?.query?.queryString?.getQuery();
  const defaultQuery = undefined;
  const existingDataset = preferredDataset || queryStringQuery?.dataset || defaultQuery?.dataset;

  // If we have an existing dataset, validate SignalType compatibility
  if (existingDataset) {
    try {
      const dataView = await services.data?.dataViews?.get(
        existingDataset.id,
        existingDataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
      );

      // Get effective signal type from dataView or preferredDataset
      const effectiveSignalType = dataView?.signalType || preferredDataset?.signalType;

      // Dataset must match required signal type (TRACES)
      if (requiredSignalType) {
        if (effectiveSignalType === requiredSignalType) {
          return existingDataset;
        }
      }
    } catch (error) {
      // Silently continue to fetch a new dataset if validation fails
      // This is expected behavior when datasets are incompatible with current flavor
    }
  }

  // Fetch first available dataset with required SignalType
  return await fetchFirstAvailableDataset(services, requiredSignalType);
};

/**
 * Get preloaded query state with dataset initialization
 */
const getPreloadedQueryState = async (
  services: AgentTracesServices,
  preferredDataset?: Dataset
): Promise<QueryState> => {
  // Always resolve the dataset to ensure SignalType validation runs
  const selectedDataset = await resolveDataset(services, preferredDataset);

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
        language: selectedDataset.language,
        timeFieldName: selectedDataset.timeFieldName,
        dataSource: selectedDataset.dataSource,
        signalType: selectedDataset.signalType,
      };
    }
  }

  if (minimalDataset) {
    const initialQueryByDataset = services.data.query.queryString.getInitialQueryByDataset({
      ...minimalDataset,
      language: minimalDataset.language || AGENT_TRACES_DEFAULT_LANGUAGE,
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
      language: AGENT_TRACES_DEFAULT_LANGUAGE,
      dataset: undefined,
    };
  }
};

/**
 * Get preloaded UI state
 */
const getPreloadedUIState = (services: AgentTracesServices): UIState => {
  return {
    activeTabId: '',
    showHistogram: true,
  };
};

/**
 * Get preloaded queryEditor state
 */
const getPreloadedQueryEditorState = async (
  services: AgentTracesServices,
  queryState?: QueryState
): Promise<QueryEditorSliceState> => {
  let promptModeIsAvailable = false;
  let summaryAgentIsAvailable = false;
  if (queryState?.dataset) {
    const results = await Promise.allSettled([
      getPromptModeIsAvailable(services),
      getSummaryAgentIsAvailable(services, queryState.dataset.dataSource?.id ?? ''),
    ]);

    promptModeIsAvailable = results[0].status === 'fulfilled' ? Boolean(results[0].value) : false;
    summaryAgentIsAvailable = results[1].status === 'fulfilled' ? Boolean(results[1].value) : false;
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
    summaryAgentIsAvailable,
    lastExecutedPrompt: '',
    queryExecutionButtonStatus: 'REFRESH',
    isQueryEditorDirty: false,
    hasUserInitiatedQuery: false,
    fetchVersion: 0,
  };
};

/**
 * Get preloaded results state (empty - not persisted)
 */
const getPreloadedResultsState = (services: AgentTracesServices): ResultsState => {
  return {};
};

/**
 * Get preloaded tab state
 */
const getPreloadedTabState = (services: AgentTracesServices): TabState => {
  return {
    logs: {},
    patterns: {
      patternsField: undefined,
      usingRegexPatterns: false,
    },
  };
};

/**
 * Get preloaded legacy state (vis_builder approach - defaults only, no saved object loading)
 */
export const getPreloadedLegacyState = async (
  services: AgentTracesServices
): Promise<LegacyState> => {
  const defaultColumns = services.uiSettings?.get(DEFAULT_TRACE_COLUMNS_SETTING);

  return {
    savedSearch: undefined,
    columns: defaultColumns || ['_source'],
    sort: [],
    isDirty: false,
    savedQuery: undefined,
    lineCount: undefined, // Flattened from metadata.lineCount

    // Fields specific to explore (not in data_explorer + discover)
    interval: 'auto',
  };
};

/**
 * Get preloaded meta state
 */
const getPreloadedMetaState = (services: AgentTracesServices) => {
  return {
    isInitialized: false,
  };
};

const getColumnsForDataset = async (
  services: AgentTracesServices,
  currentColumns?: string[]
): Promise<string[] | null> => {
  if (currentColumns && currentColumns.length > 0) {
    return null;
  }

  try {
    const tracesDefaultColumns = services.uiSettings?.get(DEFAULT_TRACE_COLUMNS_SETTING) || [
      'spanId',
    ];

    return tracesDefaultColumns;
  } catch (error) {
    return null;
  }
};
