/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SavedQuery, SavedQueryService } from '../../../../../../data/public';
import type { PromQLQuery, PromQLQueryOptions } from '../../../../../../query_enhancements/common';

interface SerializedPromQLQuery {
  promql: string;
  queryOptions?: PromQLQueryOptions;
}

const restorePromQLQuery = (savedQuery: SavedQuery): SavedQuery => {
  const query = savedQuery.attributes.query;
  if (query.language !== 'PROMQL') return savedQuery;

  const serialized: Partial<SerializedPromQLQuery> =
    typeof query.query === 'string'
      ? { promql: query.query, queryOptions: (query as PromQLQuery).queryOptions }
      : query.query;
  if (typeof serialized?.promql !== 'string') return savedQuery;

  const restoredQuery: PromQLQuery = {
    ...query,
    query: serialized.promql,
    // Older queries must clear any options left by the previous query.
    queryOptions: serialized.queryOptions,
  };
  return {
    ...savedQuery,
    attributes: { ...savedQuery.attributes, query: restoredQuery },
  };
};

// The shared saved-query service already serializes structured query values.
// Keep PromQL text and options together without changing its schema or interfaces.
export const createPrometheusSavedQueryService = (
  savedQueryService: SavedQueryService
): SavedQueryService => ({
  ...savedQueryService,
  saveQuery: async (attributes, config) => {
    const query = attributes.query as PromQLQuery;
    const serializedAttributes =
      query.language === 'PROMQL' && typeof query.query === 'string' && query.queryOptions
        ? {
            ...attributes,
            query: {
              ...query,
              query: {
                promql: query.query,
                queryOptions: query.queryOptions,
              },
            },
          }
        : attributes;
    return restorePromQLQuery(await savedQueryService.saveQuery(serializedAttributes, config));
  },
  getSavedQuery: async (id) => restorePromQLQuery(await savedQueryService.getSavedQuery(id)),
  getAllSavedQueries: async () =>
    (await savedQueryService.getAllSavedQueries()).map(restorePromQLQuery),
  findSavedQueries: async (...args) => {
    const result = await savedQueryService.findSavedQueries(...args);
    return { ...result, queries: result.queries.map(restorePromQLQuery) };
  },
});
