/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ToastsStart } from 'opensearch-dashboards/public';
import { ExploreServices } from '../../../types';
import { Dataset, DEFAULT_DATA, CORE_SIGNAL_TYPES, EMPTY_QUERY } from '../../../../../data/common';
import { QueryStringContract } from '../../../../../data/public';

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
import { getSourceTypeRegistry } from '../../../services/source_type_registry';

export interface RootState {
  query: QueryState;
  queryEditor: QueryEditorState;
  results: QueryResultState;
}

const datasetExists = async (services: ExploreServices, dataset: Dataset): Promise<boolean> => {
  const {
    data: {
      query: { queryString },
    },
  } = services;
  const datasetService = queryString.getDatasetService();

  // for index and Prometheus, it will be cached as dataview here
  if (dataset.type !== DEFAULT_DATA.SET_TYPES.INDEX_PATTERN) {
    await datasetService.cacheDataset(
      dataset,
      {
        uiSettings: services.uiSettings,
        savedObjects: services.savedObjects,
        notifications: services.notifications,
        http: services.http,
        data: services.data,
      },
      false
    );

    return true;
  }
  try {
    // for INDEX_PATTERN
    await services.data.dataViews.get(dataset.id);
    return true;
  } catch {
    return false;
  }
};

const exactMinimalDataset = (selectedDataset: Dataset) => {
  let minimalDataset: Dataset;
  // Use type assertion to check for toDataset method
  if (typeof (selectedDataset as any).toDataset === 'function') {
    minimalDataset = (selectedDataset as any).toDataset();
  } else {
    minimalDataset = {
      id: selectedDataset.id,
      title: selectedDataset.title,
      displayName: selectedDataset.displayName,
      type: selectedDataset.type,
      language: selectedDataset.language,
      timeFieldName: selectedDataset.timeFieldName,
      dataSource: selectedDataset.dataSource,
      signalType: selectedDataset.signalType,
    };
  }

  return minimalDataset;
};

export type VerificationWarning = 'datasetDoesNotExist' | 'datasetWrongLanguage';

interface VerifiedQuery {
  query: QueryState;
  warning?: VerificationWarning;
}

/**
 * Verifies a query's dataset before its row is built.
 */
export const verifyQueryAndDataset = async (
  services: ExploreServices,
  query: QueryState
): Promise<VerifiedQuery> => {
  // 1. query doesn't have dataset, do nothing(user need to select one)
  if (!query.dataset) {
    return {
      query,
    };
  }

  // 2. only return false when dataset(index pattern) doesn't exists, set dataset undefined and let user to select one
  // for index and Prometheus, will cache datasets first as dataview
  if (!(await datasetExists(services, query.dataset))) {
    return {
      query: {
        ...query,
        dataset: undefined,
      },
      warning: 'datasetDoesNotExist',
    };
  }

  const currentLanguage = query.language;

  const minimalDataset = exactMinimalDataset(query.dataset);
  // 3. verfiy language compatibility
  const resolvedLanguage = resolveDatasetLanguage(services, minimalDataset, currentLanguage);

  if (!resolvedLanguage || resolvedLanguage === currentLanguage) {
    return {
      query: {
        ...query,
        dataset: minimalDataset,
      },
    };
  }

  // 4. if language is not compatible with dataset, use resolved supported language from dataset.
  // The requested (saved) language wins when the dataset's type can run it: a dataset's own
  // `language` is only its default, and a source can offer another language on the same
  // dataset (e.g. its own SQL dialect next to PromQL). Otherwise keep the dataset's default.
  const initialQueryByDataset = services.data.query.queryString.getInitialQueryByDataset({
    ...minimalDataset,
    language: resolvedLanguage,
  });

  return {
    query: {
      ...query,
      dataset: minimalDataset,
      language: resolvedLanguage,
      query: initialQueryByDataset.query,
      queryOptions: undefined,
    },
    warning: 'datasetWrongLanguage',
  };
};

/**
 * The query a row starts with for a language on a dataset, as the query panel's language switch
 * does: PPL starts empty (its `source =` clause is added on execution); any other language,
 * including a registered source's, takes the language's own initial query (e.g. SQL's
 * `SELECT * FROM ...`, PromQL's empty one) through the data plugin.
 */
export const getInitialQueryString = (
  queryString: QueryStringContract,
  dataset: Dataset | undefined,
  language: string
) => {
  if (!dataset || language === SupportLanguageType.ppl) return EMPTY_QUERY.QUERY;
  return queryString.getInitialQueryByDataset({ ...dataset, language }).query ?? EMPTY_QUERY.QUERY;
};

/**
 * Languages the vis editor offers on a dataset: its built-in ones plus those the dataset's own
 * source lists. SQL only when SQL support is enabled.
 */
export const getEditorLanguages = (services: ExploreServices, dataset?: Dataset): string[] => {
  const builtIn: string[] = [
    SupportLanguageType.ppl,
    SupportLanguageType.promQL,
    SupportLanguageType.sql,
  ];
  const sourceLanguages = Object.keys(
    getSourceTypeRegistry().getForDataset(dataset).languageSettings ?? {}
  );
  return Array.from(new Set([...builtIn, ...sourceLanguages])).filter(
    (languageId) => services.sqlSupportEnabled || languageId !== SupportLanguageType.sql
  );
};

/**
 * The editor's languages for a dataset that its dataset type can run.
 */
export const getDatasetLanguages = (services: ExploreServices, dataset: Dataset): string[] => {
  const supported =
    services.data?.query?.queryString
      ?.getDatasetService?.()
      ?.getType(dataset.type)
      ?.supportedLanguages(dataset) ?? [];

  return getEditorLanguages(services, dataset).filter((language) => supported.includes(language));
};

/**
 * The language a row switches to when its dataset changes: the preferred (current) language if
 * the dataset can run it, else the dataset's own language, else the first one it supports.
 * A dataset often carries no `language`, so it can't be read from the dataset alone.
 */

export const resolveDatasetLanguage = (
  services: ExploreServices,
  dataset: Dataset,
  preferred?: string
): string | undefined => {
  const supportedLanguages: string[] = getDatasetLanguages(services, dataset);

  if (preferred && supportedLanguages.includes(preferred)) {
    return preferred;
  }

  if (dataset.language && supportedLanguages.includes(dataset.language)) {
    return dataset.language;
  }

  return supportedLanguages?.[0] ?? dataset?.language ?? 'PPL';
};

export const withLanguageQueryOptions = <T extends { language?: string; queryOptions?: unknown }>(
  query: T
): T =>
  getSourceTypeRegistry().isMetricsLanguage(query.language)
    ? query
    : { ...query, queryOptions: undefined };

export const getRequiredSignalType = (languageType?: SupportLanguageType): string | string[] =>
  getSourceTypeRegistry().isMetricsLanguage(languageType)
    ? CORE_SIGNAL_TYPES.METRICS
    : [CORE_SIGNAL_TYPES.LOGS, CORE_SIGNAL_TYPES.TRACES];

export const isSignalTypeCompatible = (
  effectiveSignalType: string | undefined,
  requiredSignalType: string | undefined
): boolean => {
  // If requiredSignalType is specified, dataset must match it exactly
  if (requiredSignalType) {
    return effectiveSignalType === requiredSignalType;
  }

  // If requiredSignalType is not specified, for languageType: ppl
  // dataset should not have signalType equal to Metrics
  return effectiveSignalType !== CORE_SIGNAL_TYPES.METRICS;
};

export const queryExecution = async ({
  services,
  query,
  queryString,
  updateEditorStateFn,
  updateResultFn,
  activeQueryAbortController,
}: {
  services: ExploreServices;
  query: QueryState;
  queryString: string;
  updateEditorStateFn: (updates: Partial<QueryEditorState>) => void;
  updateResultFn: (result: ISearchResult) => void;
  activeQueryAbortController: AbortController;
}) => {
  // early exit if query should skipped (for PROMQL)
  if (shouldSkipQueryExecution(query)) {
    return;
  }
  const queryStartTime = Date.now();

  try {
    updateEditorStateFn({
      queryStatus: {
        status: QueryExecutionStatus.LOADING,
        startTime: queryStartTime,
        elapsedMs: undefined,
        error: undefined,
      },
    });

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

    const dataset = await services.data.dataViews.convertToDataset(dataView);

    const preparedQueryObject = {
      ...withLanguageQueryOptions(query),
      dataset,
      query: queryString,
    };

    const searchSource = await createSearchSourceWithQuery(
      preparedQueryObject,
      dataView,
      services,
      {
        useProvidedQuery: true,
      }
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
      abortSignal: activeQueryAbortController.signal,
      withLongNumeralsSupport: await services.uiSettings.get('data:withLongNumerals'),
      ...(languageConfig?.fields?.formatter ? { formatter: languageConfig.fields.formatter } : {}),
    });

    if (activeQueryAbortController.signal.aborted) {
      return;
    }

    // Add response stats to inspector
    inspectorRequest
      .stats(getResponseInspectorStats(rawResults, searchSource))
      .ok({ json: rawResults });

    const rawResultsWithMeta: ISearchResult | IPrometheusSearchResult = {
      ...rawResults,
      elapsedMs: inspectorRequest.getTime()!,
      fieldSchema: searchSource.getDataFrame()?.schema,
      profile: searchSource.getDataFrame()?.meta?.profile,
      frameMeta: searchSource.getDataFrame()?.meta,
    };

    updateResultFn(rawResultsWithMeta);
    updateEditorStateFn({
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
  } catch (error) {
    if (activeQueryAbortController.signal.aborted) {
      return;
    }

    // Handle abort errors - reset query status to initial state
    if (error instanceof Error && error.name === 'AbortError') {
      updateEditorStateFn({
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
    let detailsFallback = 'Unknown Error';
    try {
      parsedError = JSON.parse(error.body.message);
    } catch (parseError) {
      const reason = error.body?.message || error.message || 'Unknown Error';
      const details = error.body?.error || error.message;
      parsedError = {
        error: {
          reason,
          // The reason is the title and the details are shown under it: an error that carries a
          // single message (e.g. a search strategy start failure) shows it once.
          details: details && details !== reason ? details : '',
          type: error.name,
        },
      };
      detailsFallback = '';
    }

    updateEditorStateFn({
      queryStatus: {
        status: QueryExecutionStatus.ERROR,
        startTime: queryStartTime,
        elapsedMs: undefined,
        error: {
          error: error.body?.error || 'Unknown Error',
          message: {
            details: parsedError?.error?.details || detailsFallback,
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

// A restored query's dataset no longer existed.
export const showDatasetNoLongerExistsWarning = (toasts: ToastsStart, refId: string) => {
  toasts.addWarning({
    title: i18n.translate('explore.queryPanel.datasetNoExistTitle', {
      defaultMessage: 'Query {refId}: dataset no longer exists',
      values: { refId },
    }),
    text: i18n.translate('explore.queryPanel.datasetNoExistText', {
      defaultMessage: 'Select one to run it.',
    }),
    id: `dataset-no-exist-${refId}`,
  });
};

// A restored query's language didn't fit its dataset and was replaced.
export const showDatasetQueryLanguageIncompatibleWarning = (toasts: ToastsStart, refId: string) => {
  toasts.addWarning({
    title: i18n.translate('explore.queryPanel.datasetQueryLanguageIncompatibleWarningTitle', {
      defaultMessage: 'Query {refId} has incompatible language against selected dataset',
      values: { refId },
    }),
    text: i18n.translate('explore.queryPanel.datasetQueryLanguageIncompatibleWarningText', {
      defaultMessage:
        "Its dataset can't run current query, so the query was reset. Write it again.",
    }),
    id: `dataset-query-language-incompatible-${refId}`,
  });
};

// A restored query without a dataset stays empty
export const showUndefinedDatasetWarning = (toasts: ToastsStart, refId: string) => {
  toasts.addWarning({
    title: i18n.translate('explore.queryPanel.undefinedDatasetTitle', {
      defaultMessage: 'Query {refId} has no dataset',
      values: { refId },
    }),
    text: i18n.translate('explore.queryPanel.undefinedDatasetText', {
      defaultMessage: 'Select a dataset to run it.',
    }),
    id: `undefined-dataset-${refId}`,
  });
};

// Several rows run together: the time range the agent generated for one row is not applied.
export const showGeneratedTimeRangeIgnoredWarning = (
  toasts: ToastsStart,
  refId: string,
  timeRange: { from: string; to: string }
) => {
  toasts.addWarning({
    title: i18n.translate('explore.queryPanel.generatedTimeRangeIgnoredTitle', {
      defaultMessage: 'Query {refId}: generated time range not applied',
      values: { refId },
    }),
    text: i18n.translate('explore.queryPanel.generatedTimeRangeIgnoredText', {
      defaultMessage:
        'Several queries share one time range. Set {from} to {to} in the time picker to use it.',
      values: { from: timeRange.from, to: timeRange.to },
    }),
    id: `generated-time-range-ignored-${refId}`,
  });
};

export const showSkippedQueriesWarning = (
  toasts: ToastsStart,
  { noDataset, emptyQuery }: { noDataset: string[]; emptyQuery: string[] }
) => {
  const lines = [
    noDataset.length > 0
      ? i18n.translate('explore.queryPanel.skippedNoDatasetText', {
          defaultMessage: 'Query {refIds}: no dataset selected.',
          values: { refIds: noDataset.join(', ') },
        })
      : undefined,
    emptyQuery.length > 0
      ? i18n.translate('explore.queryPanel.skippedEmptyQueryText', {
          defaultMessage: 'Query {refIds}: the query is empty.',
          values: { refIds: emptyQuery.join(', ') },
        })
      : undefined,
  ].filter(Boolean);
  if (lines.length === 0) return;
  toasts.addWarning({
    title: i18n.translate('explore.queryPanel.skippedQueriesTitle', {
      defaultMessage: 'Some queries were skipped',
    }),
    text: lines.join(' '),
    id: 'skipped-queries-warning',
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
