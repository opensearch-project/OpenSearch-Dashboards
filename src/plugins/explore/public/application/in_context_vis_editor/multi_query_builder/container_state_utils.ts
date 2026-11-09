/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToastsStart } from 'opensearch-dashboards/public';
import { getQueryLabel } from '../../../../../data/common';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../common';
import { ExploreServices } from '../../../types';
import { QueryState, QueryEditorState } from '../query_builder/query_builder';
import {
  resolveDatasetLanguage,
  getInitialQueryString,
  showDatasetQueryLanguageIncompatibleWarning,
  showDatasetNoLongerExistsWarning,
  verifyQueryAndDataset,
  VerificationWarning,
} from '../query_builder/utils';
import { QUERY_BUILDER_QUERY_STATE_KEY, QUERY_EDITOR_STATE_KEY } from '../types';
import {
  normalizeUrlEditorState,
  normalizeUrlQueries,
  UrlMultiEditorState,
  UrlRowEntry,
} from './utils';
import { withLanguageQueryOptions } from '../query_builder/utils';
import { EditorMode } from '../../../application/utils/state_management/types';
import { getRowsMaxDataPoints } from './utils';

export interface ContainerState {
  queries: Array<UrlRowEntry<QueryState>>;
  editorState: UrlMultiEditorState;
}

// for invalid datasets, will display warning
export interface ContainerStateWarning {
  kind: VerificationWarning;
  refId: string;
}

const EMPTY_CONTAINER_STATE: ContainerState = { queries: [], editorState: { rows: [] } };

/**
 * Merges the URL and the saved object state. URL has higher priority
 */
export const mergeContainerState = (
  url: ContainerState,
  saved: ContainerState = EMPTY_CONTAINER_STATE
): ContainerState => {
  const fromUrl = url.queries.length > 0;

  const { queries: source, editorState } = fromUrl ? url : saved;

  // avoid duplicate refId from url
  const seen = new Set<string>();
  const queries = source.filter(([refId]) => {
    if (seen.has(refId)) return false;
    seen.add(refId);
    return true;
  });

  // for each row's editor state, only apply to rows that exist
  const refIds = new Set(queries.map(([refId]) => refId));
  const { selectedRowRefId, maxDataPoints, rows } = editorState;
  return {
    queries,
    editorState: {
      ...(maxDataPoints !== undefined ? { maxDataPoints } : {}),
      ...(selectedRowRefId && refIds.has(selectedRowRefId) ? { selectedRowRefId } : {}),
      rows: rows.filter(([refId]) => refIds.has(refId)),
    },
  };
};

const readUrlContainerState = (services: ExploreServices): ContainerState => {
  const urlStateStorage = services.osdUrlStateStorage;
  if (!urlStateStorage) {
    return EMPTY_CONTAINER_STATE;
  }

  try {
    const queries = normalizeUrlQueries(urlStateStorage.get(QUERY_BUILDER_QUERY_STATE_KEY));
    const editorState = normalizeUrlEditorState(urlStateStorage.get(QUERY_EDITOR_STATE_KEY));
    // a legacy URL keeps the shared value on its single query's queryOptions
    const maxDataPoints = editorState.maxDataPoints ?? getRowsMaxDataPoints(queries);
    return { queries, editorState: { ...editorState, maxDataPoints } };
  } catch {
    return EMPTY_CONTAINER_STATE;
  }
};

// build default query from current default dataset
const buildDefaultQuery = async (services: ExploreServices): Promise<QueryState> => {
  const queryString = services.data.query.queryString;
  try {
    const dataset = await services.data.query.getDefaultDataset();
    if (dataset) {
      const language = resolveDatasetLanguage(services, dataset) ?? EXPLORE_DEFAULT_LANGUAGE;
      return {
        dataset,
        language,
        query: getInitialQueryString(queryString, dataset, language),
      };
    }
  } catch {
    // start empty and let the user pick one.
  }
  return { query: '', language: EXPLORE_DEFAULT_LANGUAGE, dataset: undefined };
};

/**
 * Load the container's starting state: URL over saved queries
 * For a new editor, set a default row;
 * Each restored row is verified with verifyQueryAndDataset.
 * Will return warnings if the dataset is not valid for following cases:
 * 1. dataset is not compatible with language
 * 2. dataset is no longer available
 */
export const loadContainerState = async (
  services: ExploreServices,
  saved?: ContainerState
): Promise<{ state: ContainerState; warnings: ContainerStateWarning[] }> => {
  const mergedStates = mergeContainerState(readUrlContainerState(services), saved);

  if (mergedStates.queries.length === 0) {
    return {
      // no loaded quries, set a default one
      state: { ...mergedStates, queries: [[getQueryLabel(0), await buildDefaultQuery(services)]] },
      warnings: [],
    };
  }

  const warnings: ContainerStateWarning[] = [];
  // Rows verify in parallel.
  const queries = await Promise.all(
    mergedStates.queries.map(async ([refId, query]): Promise<UrlRowEntry<QueryState>> => {
      const { query: verified, warning } = await verifyQueryAndDataset(services, query);

      if (warning) warnings.push({ kind: warning, refId });
      return [refId, verified];
    })
  );
  return { state: { ...mergedStates, queries }, warnings };
};

export const showContainerStateWarnings = (
  toasts: ToastsStart,
  warnings: ContainerStateWarning[]
) => {
  warnings.forEach((warning) => {
    switch (warning.kind) {
      case 'datasetDoesNotExist':
        showDatasetNoLongerExistsWarning(toasts, warning.refId);
        break;
      case 'datasetWrongLanguage':
        showDatasetQueryLanguageIncompatibleWarning(toasts, warning.refId);
        break;
    }
  });
};

/** One row as it is saved: what it runs and whether it's hidden. */
export interface SaveableRow {
  refId: string;
  queryState: QueryState;
  isHidden?: boolean;
  // row in prompt mode saves lastExecutedTranslatedQuery
  editorMode?: QueryEditorState['editorMode'];
  lastExecutedTranslatedQuery?: string;
}

// The rows as the saved object stores them. Add panel's max data points goes on each row's queryOptions.
export const toSavedContainerState = (
  rows: SaveableRow[],
  maxDataPoints?: number
): ContainerState => ({
  queries: rows.map(({ refId, queryState, editorMode, lastExecutedTranslatedQuery }) => {
    const query = withLanguageQueryOptions({
      ...queryState,
      queryOptions: { ...queryState.queryOptions, maxDataPoints },
    });
    return [
      refId,
      editorMode === EditorMode.Prompt
        ? { ...query, query: lastExecutedTranslatedQuery ?? query.query }
        : query,
    ];
  }),
  editorState: {
    rows: rows.map(({ refId, isHidden }) => [refId, { isHidden: !!isHidden }]),
  },
});
