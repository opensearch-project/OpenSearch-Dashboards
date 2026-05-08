/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ToastsStart } from 'opensearch-dashboards/public';
import { ExploreServices } from '../../../types';
import { Dataset, DEFAULT_DATA, CORE_SIGNAL_TYPES } from '../../../../../data/common';
import { ExploreFlavor } from '../../../../../explore/common';
import { fetchFirstAvailableDataset } from '../../../application/utils/state_management/utils/redux_persistence';
import {
  QueryState,
  QueryEditorState,
  QueryResultState,
  SupportLanguageType,
} from './query_builder';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';

import {
  createSearchSourceWithQuery,
  shouldSkipQueryExecution,
} from '../../../application/utils/state_management/actions/query_actions';

import { getResponseInspectorStats } from '../../../application/legacy/discover/opensearch_dashboards_services';

import {
  ISearchResult,
  IPrometheusSearchResult,
} from '../../../application/utils/state_management/slices';
import { AgentError, ProhibitedQueryError } from '../../../components/query_panel/utils/error';

export interface RootState {
  query: QueryState;
  queryEditor: QueryEditorState;
  results: QueryResultState;
}

// Resolve dataset based on selected language type (for in-context editor)
// PromQL → PROMETHEUS, PPL/AI → INDEX_PATTERN
export const resolveDatasetByLanguage = async (
  services: ExploreServices,
  languageType: SupportLanguageType,
  preferredDataset?: Dataset
): Promise<Dataset | undefined> => {
  // Get existing dataset from QueryStringManager or use preferred dataset
  const queryStringQuery = services.data?.query?.queryString?.getQuery();
  const defaultQuery = services.data?.query?.queryString?.getDefaultQuery();
  const existingDataset = preferredDataset || queryStringQuery?.dataset || defaultQuery?.dataset;

  // Determine dataset type based on language
  const isPromQL = languageType === SupportLanguageType.promQL;
  // for CORE_SIGNAL_TYPES, rule if languageType, then assume its flavor is METRICS otherwise is logs
  const requiredSignalType = isPromQL ? CORE_SIGNAL_TYPES.METRICS : undefined;

  if (existingDataset) {
    try {
      const dataView = await services.data?.dataViews?.get(
        existingDataset.id,
        existingDataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN
      );
      // Get effective signal type from dataView or preferredDataset (for Prometheus)
      const effectiveSignalType = dataView?.signalType || preferredDataset?.signalType;
      // Validate signal type matches flavor
      if (isSignalTypeCompatible(effectiveSignalType, requiredSignalType)) {
        return existingDataset;
      }
    } catch (error) {
      // Dataset no longer exists or validation failed
      // Silently continue to fetch a new dataset if validation fails
      // This is expected behavior when datasets are incompatible with current flavor
    }
  }

  // Fetch first available dataset of the required type
  const flavor = isPromQL ? ExploreFlavor.Metrics : null;
  return await fetchFirstAvailableDataset(services, flavor, requiredSignalType);
};

export const getPreloadedQueryState = async (
  services: ExploreServices,
  languageType: SupportLanguageType,
  preferredDataset?: Dataset
): Promise<QueryState> => {
  // Always validate the dataset and language type
  const selectedDataset = await resolveDatasetByLanguage(services, languageType, preferredDataset);

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
      language: minimalDataset.language || 'PPL',
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
      language: languageType ?? 'PPL',
      dataset: undefined,
    };
  }
};

export const getRequiredSignalType = (languageType?: SupportLanguageType): string | string[] => {
  switch (languageType) {
    case SupportLanguageType.promQL:
      return CORE_SIGNAL_TYPES.METRICS;
    default:
      return [CORE_SIGNAL_TYPES.LOGS, CORE_SIGNAL_TYPES.TRACES];
  }
};

export const isSignalTypeCompatible = (
  effectiveSignalType: string | undefined,
  requiredSignalType: string | undefined
): boolean => {
  // If requiredSignalType is specified, dataset must match it exactly
  if (requiredSignalType) {
    return effectiveSignalType === requiredSignalType;
  }

  // If requiredSignalType is not specified (i.e., Logs flavor),
  // dataset should not have signalType equal to Traces or Metrics
  return (
    effectiveSignalType !== CORE_SIGNAL_TYPES.TRACES &&
    effectiveSignalType !== CORE_SIGNAL_TYPES.METRICS
  );
};

export const queryExecution = async ({
  services,
  queryString,
  updateEditorStateFn,
  updateResultFn,
  activeQueryAbortControllers,
}: {
  services: ExploreServices;
  queryString: string;
  // query: Query;
  // queryEditorState: QueryEditorState;
  updateEditorStateFn: (updates: Partial<QueryEditorState>) => void;
  updateResultFn: (result: ISearchResult) => void;
  activeQueryAbortControllers: Map<string, AbortController>;
}) => {
  // early exit if query should skipped (for PROMQL)
  const query = services.data.query.queryString.getQuery();
  if (shouldSkipQueryExecution(query)) {
    return;
  }
  const queryStartTime = Date.now();

  try {
    updateEditorStateFn({
      // currentRunningQuery: cacheKey,
      queryStatus: {
        status: QueryExecutionStatus.LOADING,
        startTime: queryStartTime,
        elapsedMs: undefined,
        error: undefined,
      },
    });

    // Abort any existing query with the same cacheKey (prevents duplicate queries)
    const existingController = activeQueryAbortControllers.get(queryString);
    if (existingController) {
      existingController.abort();
    }
    // Don't auto-abort other queries - let them complete unless explicitly cancelled
    // This prevents data loading issues when multiple queries are running concurrently

    // Create abort controller for this specific query
    const abortController = new AbortController();
    // Store controller by cacheKey for individual query abort
    activeQueryAbortControllers.set(queryString, abortController);

    services.inspectorAdapters.requests.reset();
    const title = i18n.translate('explore.discover.inspectorRequestDataTitle', {
      defaultMessage: 'data',
    });
    const description = i18n.translate('explore.discover.inspectorRequestDescription', {
      defaultMessage: 'This request queries OpenSearch to fetch the data for the search.',
    });
    const inspectorRequest = services.inspectorAdapters.requests.start(title, { description });

    await services.data.dataViews.ensureDefaultDataView();
    const dataView = query.dataset
      ? await services.data.dataViews.get(query.dataset.id, query.dataset.type !== 'INDEX_PATTERN')
      : await services.data.dataViews.getDefault();

    if (!dataView) {
      throw new Error('Dataset not found for query execution');
    }

    const dataset = services.data.dataViews.convertToDataset(dataView);

    const preparedQueryObject = {
      ...query,
      dataset,
      query: queryString,
    };

    const searchSource = await createSearchSourceWithQuery(
      preparedQueryObject,
      dataView,
      services,
      false // No histogram
    );

    if ((services as any).getRequestInspectorStats && inspectorRequest) {
      inspectorRequest.stats((services as any).getRequestInspectorStats(searchSource));
    }

    if (inspectorRequest) {
      searchSource.getSearchRequestBody().then((body: object) => {
        inspectorRequest.json(body);
      });
    }

    const languageConfig = services.data.query.queryString
      .getLanguageService()
      .getLanguage(query.language);

    // Execute query
    const rawResults = await searchSource.fetch({
      abortSignal: abortController.signal,
      withLongNumeralsSupport: await services.uiSettings.get('data:withLongNumerals'),
      ...(languageConfig?.fields?.formatter ? { formatter: languageConfig.fields.formatter } : {}),
    });

    // Add response stats to inspector
    inspectorRequest
      .stats(getResponseInspectorStats(rawResults, searchSource))
      .ok({ json: rawResults });

    const rawResultsWithMeta: ISearchResult | IPrometheusSearchResult = {
      ...rawResults,
      elapsedMs: inspectorRequest.getTime()!,
      fieldSchema: searchSource.getDataFrame()?.schema,
    };

    updateResultFn(rawResultsWithMeta);
    updateEditorStateFn({
      // currentRunningQuery: cacheKey,
      queryStatus: {
        status:
          rawResults.hits?.hits?.length > 0
            ? QueryExecutionStatus.READY
            : QueryExecutionStatus.NO_RESULTS,
        startTime: queryStartTime,
        elapsedMs: inspectorRequest.getTime()!,
        error: undefined,
      },
    });
    activeQueryAbortControllers.delete(queryString);
  } catch (error) {
    // Clean up aborted/failed query from active controllers
    activeQueryAbortControllers.delete(queryString);
    // Handle abort errors - reset query status to initial state
    if (error instanceof Error && error.name === 'AbortError') {
      updateEditorStateFn({
        // currentRunningQuery: cacheKey,
        queryStatus: {
          status: QueryExecutionStatus.UNINITIALIZED,
          startTime: undefined,
          elapsedMs: undefined,
          error: undefined,
        },
      });
      return;
    }

    let parsedError;
    try {
      parsedError = JSON.parse(error.body.message);
    } catch (parseError) {
      parsedError = {
        error: {
          reason: error.body?.message || error.message || 'Unknown Error',
          details: error.body?.error || 'An error occurred',
          type: error.name,
        },
      };
    }

    updateEditorStateFn({
      queryStatus: {
        status: QueryExecutionStatus.ERROR,
        startTime: queryStartTime,
        elapsedMs: undefined,
        error: {
          error: error.body?.error || 'Unknown Error',
          message: {
            details: parsedError?.error?.details || 'Unknown Error',
            reason: parsedError?.error?.reason || 'Unknown Error',
            type: parsedError?.error?.type,
          },
          statusCode: error.body?.statusCode,
          originalErrorMessage: error.body?.message,
        },
      },
    });
    throw error;
  }
};

export const showPromptModeNotAvailableWarning = (toasts: ToastsStart) => {
  toasts.addWarning({
    title: i18n.translate('explore.queryPanel.queryAssist-not-available-title', {
      defaultMessage: 'Unavailable',
    }),
    text: i18n.translate('explore.queryPanel.queryAssist-not-available-text', {
      defaultMessage: 'Query assist feature is not enabled or configured.',
    }),
    id: 'queryAssist-not-available',
  });
};

export const showMissingPromptWarning = (toasts: ToastsStart) => {
  toasts.addWarning({
    title: i18n.translate('explore.queryPanel.missing-prompt-warning-title', {
      defaultMessage: 'Missing prompt',
    }),
    text: i18n.translate('explore.queryPanel.missing-prompt-warning-text', {
      defaultMessage: 'Enter a question to automatically generate a query',
    }),
    id: 'missing-prompt-warning',
  });
};

export const showMissingDatasetWarning = (toasts: ToastsStart) => {
  toasts.addWarning({
    title: i18n.translate('explore.queryPanel.missing-dataset-warning', {
      defaultMessage: 'Select a dataset to ask a question',
    }),
    id: 'missing-dataset-warning',
  });
};

export const handleAgentError = (toasts: ToastsStart, error: Error) => {
  if (error instanceof ProhibitedQueryError) {
    toasts.addError(error, {
      id: 'prohibited-query-error',
      title: i18n.translate('explore.queryPanel.prohibited-query-error', {
        defaultMessage: 'I am unable to respond to this query. Try another question',
      }),
    });
  } else if (error instanceof AgentError) {
    toasts.addError(error, {
      id: 'agent-error',
      title: i18n.translate('explore.queryPanel.agent-error', {
        defaultMessage: 'I am unable to respond to this query. Try another question',
      }),
    });
  } else {
    toasts.addError(error, {
      id: 'miscellaneous-prompt-error',
      title: i18n.translate('explore.queryPanel.miscellaneous-prompt-error', {
        defaultMessage: 'Failed to generate results',
      }),
    });
  }
};
