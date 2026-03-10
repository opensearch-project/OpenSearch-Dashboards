/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCurrentAppId, getFlavorFromAppId } from '../../../../helpers/get_flavor_from_app_id';
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
import {
  Dataset,
  DataStructure,
  DEFAULT_DATA,
  CORE_SIGNAL_TYPES,
} from '../../../../../../data/common';
import { DatasetTypeConfig, IDataPluginServices } from '../../../../../../data/public';
import {
  DEFAULT_COLUMNS_SETTING,
  DEFAULT_TRACE_COLUMNS_SETTING,
  DEFAULT_LOGS_COLUMNS_SETTING,
  ExploreFlavor,
  EXPLORE_DEFAULT_LANGUAGE,
} from '../../../../../common';
import { getPromptModeIsAvailable } from '../../get_prompt_mode_is_available';
import { getSummaryAgentIsAvailable } from '../../get_summary_agent_is_available';
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

    // Determine current flavor to detect cross-flavor navigation
    const currentAppId = await getCurrentAppId(services);
    const currentFlavor = getFlavorFromAppId(currentAppId);
    const currentRequiredSignalType =
      currentFlavor === ExploreFlavor.Traces
        ? CORE_SIGNAL_TYPES.TRACES
        : currentFlavor === ExploreFlavor.Metrics
        ? CORE_SIGNAL_TYPES.METRICS
        : undefined; // Logs

    // Get URL state
    let queryState = services.osdUrlStateStorage.get('_q') as QueryState | null;
    const appState = services.osdUrlStateStorage.get('_a') as AppState | null;

    // Check if we're loading a saved search (view route)
    const isViewRoute = window.location.hash.includes('/view/');

    // If on a view route, check if the saved search's flavor matches current flavor
    if (isViewRoute && queryState?.dataset) {
      const urlSignalType = queryState.dataset.signalType;
      const isIncompatibleForView =
        (currentRequiredSignalType &&
          urlSignalType &&
          urlSignalType !== currentRequiredSignalType) ||
        (!currentRequiredSignalType &&
          (urlSignalType === CORE_SIGNAL_TYPES.TRACES ||
            urlSignalType === CORE_SIGNAL_TYPES.METRICS));

      if (isIncompatibleForView) {
        // Navigate to base page instead of trying to load incompatible saved viz
        const baseUrl = services.application?.getUrlForApp(`explore/${currentFlavor}`, {
          path: '#/',
        });
        if (baseUrl && services.application) {
          services.application.navigateToUrl(baseUrl);
          // Return a basic state to prevent further processing
          return await getPreloadedState(services);
        }
      }
    }

    // Get the default dataset to check if we should prefer it over URL cached dataset
    const defaultDataset =
      currentFlavor === ExploreFlavor.Metrics
        ? undefined
        : services.data?.query?.queryString?.getDatasetService()?.getDefault();

    // If URL has query state and we're NOT on a view route, check if we need a better dataset
    let replacementDataset: Dataset | undefined;
    if (!isViewRoute && queryState?.dataset) {
      // Fetch full dataset from dataViews to get signalType if not already present
      let urlSignalType = queryState.dataset.signalType;
      if (!urlSignalType) {
        try {
          const fullDataset = await services.data?.dataViews?.get(queryState.dataset.id);
          urlSignalType = fullDataset?.signalType;
        } catch (error) {
          // If fetch fails, continue with undefined signalType
        }
      }

      // Check if dataset is incompatible OR suboptimal
      const isIncompatible =
        (currentRequiredSignalType && urlSignalType !== currentRequiredSignalType) ||
        (!currentRequiredSignalType &&
          (urlSignalType === CORE_SIGNAL_TYPES.TRACES ||
            urlSignalType === CORE_SIGNAL_TYPES.METRICS));

      // For Logs flavor, also check if we should find a better dataset with explicit 'logs' signalType
      const shouldFindBetter =
        !currentRequiredSignalType && // Logs flavor
        urlSignalType !== CORE_SIGNAL_TYPES.LOGS && // Current dataset doesn't have explicit 'logs'
        urlSignalType !== CORE_SIGNAL_TYPES.TRACES &&
        urlSignalType !== CORE_SIGNAL_TYPES.METRICS; // But is technically compatible

      // Check if there's a default dataset that's PERFECT match (not just compatible)
      const shouldPreferDefault =
        defaultDataset &&
        defaultDataset.id !== queryState.dataset.id && // Different from URL dataset
        ((currentRequiredSignalType && defaultDataset.signalType === currentRequiredSignalType) || // Exact match for Traces/Metrics
          (!currentRequiredSignalType && defaultDataset.signalType === CORE_SIGNAL_TYPES.LOGS)); // Perfect match for Logs (explicit logs signalType)

      if (isIncompatible || shouldFindBetter || shouldPreferDefault) {
        // If we should prefer default and it's a PERFECT match, use it directly
        if (shouldPreferDefault && defaultDataset) {
          replacementDataset = defaultDataset;
        } else {
          // Proactively fetch a compatible dataset for the current flavor
          try {
            await services.data.dataViews.ensureDefaultDataView();
            replacementDataset = await fetchFirstAvailableDataset(
              services,
              currentFlavor,
              currentRequiredSignalType
            );

            // If no compatible dataset found, fall back to default dataset
            if (!replacementDataset && defaultDataset) {
              replacementDataset = defaultDataset;
            }

            // Last resort: fall back to any default dataview
            if (!replacementDataset) {
              try {
                const defaultDataView = await services.data.dataViews.getDefault();
                if (defaultDataView) {
                  replacementDataset = services.data.dataViews.convertToDataset(defaultDataView);
                }
              } catch (err) {
                // Continue without replacement dataset
              }
            }
          } catch (error) {
            // Continue even if fetch fails
          }
        }

        // Clear the incompatible query state from URL
        services.osdUrlStateStorage.set('_q', null, { replace: true });
        queryState = null;
      }
    }

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

    // If we found a replacement dataset due to incompatibility, use that instead
    if (replacementDataset) {
      urlDataset = replacementDataset;
    }

    // Always call getPreloadedQueryState to ensure SignalType validation runs
    const resolvedQueryState = await getPreloadedQueryState(services, urlDataset);

    // If queryState was cleared above (due to incompatibility), just use the resolved state
    // Also check if dataset changed - if so, clear the query as it's likely incompatible
    const datasetChanged =
      queryState?.dataset?.id &&
      resolvedQueryState.dataset?.id &&
      queryState.dataset.id !== resolvedQueryState.dataset.id;

    const finalQueryState: QueryState = queryState
      ? {
          ...queryState,
          dataset: resolvedQueryState.dataset,
          // Keep language and query from URL if dataset is compatible and hasn't changed
          // If dataset changed or was replaced, clear the query
          language:
            datasetChanged || replacementDataset
              ? resolvedQueryState.language
              : queryState.language || resolvedQueryState.language,
          query: datasetChanged || replacementDataset ? '' : queryState.query || '',
        }
      : resolvedQueryState;

    // If no dataset was resolved, ensure query is empty
    if (!finalQueryState.dataset) {
      finalQueryState.query = '';
    }

    // Force update QueryStringManager to ensure UI components (like DatasetSelect) re-render
    // Use force=true if we replaced the dataset due to incompatibility or dataset changed
    const forceUpdate = !!replacementDataset || datasetChanged;
    services.data.query.queryString.setQuery(finalQueryState, forceUpdate);

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
export const getPreloadedState = async (services: ExploreServices): Promise<RootState> => {
  const queryState = await getPreloadedQueryState(services);
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
  services: ExploreServices,
  flavor: ExploreFlavor | null,
  requiredSignalType?: string
): Promise<Dataset | undefined> => {
  try {
    const datasetService = services.data?.query?.queryString?.getDatasetService();
    if (!datasetService) {
      return undefined;
    }

    const typeConfig: DatasetTypeConfig | undefined = datasetService.getType(
      flavor === ExploreFlavor.Metrics ? 'PROMETHEUS' : 'INDEX_PATTERN'
    );
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
      // Get default dataset ID to prefer it if found in the list
      const defaultDataset = services.data?.query?.queryString?.getDatasetService()?.getDefault();
      const defaultDatasetId = defaultDataset?.id;

      // For Logs flavor, prefer datasets with explicit 'logs' signalType
      let fallbackDataset: Dataset | undefined;
      let perfectMatchDataset: Dataset | undefined;

      for (const dataset of fetchedDatasets) {
        try {
          const dataView = await services.data?.dataViews?.get(
            dataset.id,
            dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
          );

          // Get effective signal type from dataView or dataset (for Prometheus which sets signalType directly)
          const effectiveSignalType = dataView?.signalType || dataset.signalType;

          // If requiredSignalType is specified, dataset must match it
          if (requiredSignalType) {
            if (effectiveSignalType === requiredSignalType) {
              // Check if this is the default dataset
              if (defaultDatasetId && dataset.id === defaultDatasetId) {
                return dataset;
              }
              // Save as perfect match but continue checking for default
              if (!perfectMatchDataset) {
                perfectMatchDataset = dataset;
              }
            }
          } else {
            // If requiredSignalType is not specified (i.e., Logs flavor),
            // Prefer datasets with explicit 'logs' signalType, but accept any non-traces/non-metrics
            if (effectiveSignalType === CORE_SIGNAL_TYPES.LOGS) {
              // Check if this is the default dataset
              if (defaultDatasetId && dataset.id === defaultDatasetId) {
                return dataset;
              }
              // Save as perfect match but continue checking for default
              if (!perfectMatchDataset) {
                perfectMatchDataset = dataset;
              }
            } else if (
              effectiveSignalType !== CORE_SIGNAL_TYPES.TRACES &&
              effectiveSignalType !== CORE_SIGNAL_TYPES.METRICS &&
              !fallbackDataset
            ) {
              // Compatible but not explicitly logs - save as fallback
              fallbackDataset = dataset;
            }
          }
        } catch (error) {
          // Continue to next dataset if this one fails
          continue;
        }
      }

      // Return in priority order: perfect match > fallback > undefined
      if (perfectMatchDataset) {
        return perfectMatchDataset;
      }

      if (fallbackDataset) {
        return fallbackDataset;
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
  services: ExploreServices,
  preferredDataset?: Dataset
): Promise<Dataset | undefined> => {
  const currentAppId = await getCurrentAppId(services);
  const flavorFromAppId = getFlavorFromAppId(currentAppId);
  const requiredSignalType =
    flavorFromAppId === ExploreFlavor.Traces
      ? CORE_SIGNAL_TYPES.TRACES
      : flavorFromAppId === ExploreFlavor.Metrics
      ? CORE_SIGNAL_TYPES.METRICS
      : undefined;

  // Get datasets from QueryStringManager and DatasetService
  const queryStringQuery = services.data?.query?.queryString?.getQuery();
  const cachedDataset = queryStringQuery?.dataset;

  // Get the actual default dataset from DatasetService (not from getDefaultQuery)
  // This is the dataset marked with "Default" badge in the UI
  const defaultDataset =
    flavorFromAppId === ExploreFlavor.Metrics
      ? undefined
      : services.data?.query?.queryString?.getDatasetService()?.getDefault();

  // Priority: preferredDataset > defaultDataset (if compatible) > cachedDataset (if compatible) > fetch

  // If we have a preferred dataset, use it immediately
  if (preferredDataset) {
    return preferredDataset;
  }

  // Check if default dataset is compatible - ALWAYS PREFER DEFAULT if it exists and is compatible
  if (defaultDataset) {
    try {
      const effectiveSignalType = defaultDataset.signalType;

      // For Traces/Metrics - accept default if it has exact signalType match
      if (requiredSignalType && effectiveSignalType === requiredSignalType) {
        return defaultDataset;
      }

      // For Logs - ONLY accept default if it has explicit 'logs' signalType
      // Don't accept if it just has no signalType - we want to fetch a better one with explicit logs signalType
      if (!requiredSignalType && effectiveSignalType === CORE_SIGNAL_TYPES.LOGS) {
        return defaultDataset;
      }
    } catch (error) {
      // Continue to check cached dataset
    }
  }

  // Check cached dataset only if default wasn't available or compatible
  if (cachedDataset) {
    try {
      // Fetch full dataset from dataViews to get signalType if not already present
      const fullDataset = cachedDataset.signalType
        ? cachedDataset
        : await services.data?.dataViews?.get(cachedDataset.id);

      const effectiveSignalType = fullDataset?.signalType;

      // For Traces/Metrics - accept cached if exact match
      if (requiredSignalType && effectiveSignalType === requiredSignalType) {
        return cachedDataset;
      }

      // For Logs - accept cached if explicit 'logs'
      if (!requiredSignalType && effectiveSignalType === CORE_SIGNAL_TYPES.LOGS) {
        return cachedDataset;
      }

      // For Logs - cached is compatible if it has no signalType (fallback)
      if (!requiredSignalType && !effectiveSignalType) {
        return cachedDataset;
      }

      // For Logs - cached is compatible but not optimal (no explicit signalType)
      // Don't return yet - continue to fetch to find better option
    } catch (error) {
      // If fetch fails, continue to try fetching new dataset
    }
  }

  // Fetch first available dataset with required SignalType
  const compatibleDataset = await fetchFirstAvailableDataset(
    services,
    flavorFromAppId,
    requiredSignalType
  );

  if (compatibleDataset) {
    return compatibleDataset;
  }

  // If no compatible dataset found with signalType filtering, try to get any available dataset as fallback
  if (!compatibleDataset && requiredSignalType === undefined) {
    // For Logs flavor, if no dataset without signalType found, try to get a default dataset
    try {
      const fallbackDefaultDataset = services.data?.query?.queryString
        ?.getDatasetService()
        ?.getDefault();
      if (fallbackDefaultDataset) {
        return fallbackDefaultDataset;
      }
    } catch (error) {
      // Continue to return undefined
    }
  }

  return compatibleDataset;
};

/**
 * Get preloaded query state with dataset initialization
 */
const getPreloadedQueryState = async (
  services: ExploreServices,
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
      language: minimalDataset.language || EXPLORE_DEFAULT_LANGUAGE,
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
    patterns: {
      patternsField: undefined,
      usingRegexPatterns: false,
    },
  };
};

/**
 * Get preloaded legacy state (vis_builder approach - defaults only, no saved object loading)
 */
export const getPreloadedLegacyState = async (services: ExploreServices): Promise<LegacyState> => {
  // Only return defaults - NO saved object loading (like vis_builder)
  const currentAppId = await getCurrentAppId(services);
  const flavorFromAppId = getFlavorFromAppId(currentAppId);

  const defaultColumns =
    flavorFromAppId === ExploreFlavor.Traces
      ? services.uiSettings?.get(DEFAULT_TRACE_COLUMNS_SETTING)
      : flavorFromAppId === ExploreFlavor.Logs
      ? services.uiSettings?.get(DEFAULT_LOGS_COLUMNS_SETTING)
      : services.uiSettings?.get(DEFAULT_COLUMNS_SETTING);

  return {
    // Fields that exist in data_explorer + discover
    // TODO: load saved explore by id
    savedSearch: undefined, // Matches discover format - string ID, not object
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
const getPreloadedMetaState = (services: ExploreServices) => {
  return {
    isInitialized: false,
  };
};

const getColumnsForDataset = async (
  services: ExploreServices,
  currentColumns?: string[]
): Promise<string[] | null> => {
  if (currentColumns && currentColumns.length > 0) {
    return null;
  }

  try {
    const currentAppId = await getCurrentAppId(services);
    const currentFlavor = getFlavorFromAppId(currentAppId);
    const isTracesFlavor = currentFlavor === ExploreFlavor.Traces;

    const tracesDefaultColumns = services.uiSettings?.get(DEFAULT_TRACE_COLUMNS_SETTING) || [
      'spanId',
    ];
    const logsDefaultColumns = services.uiSettings?.get(DEFAULT_LOGS_COLUMNS_SETTING) || [
      '_source',
    ];

    return isTracesFlavor ? tracesDefaultColumns : logsDefaultColumns;
  } catch (error) {
    return null;
  }
};
