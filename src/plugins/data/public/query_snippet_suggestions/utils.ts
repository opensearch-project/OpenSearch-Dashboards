/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IQueryStart, SavedQuery } from '../query';
import { QuerySnippetItem } from './types';
import { getQueryService, getSavedObjects } from '../services';

export const transformSavedQueryToSnippet = (savedQuery: SavedQuery): QuerySnippetItem => {
  return {
    id: savedQuery.id,
    query: savedQuery.attributes.query,
    title: savedQuery.attributes.title,
    description: savedQuery.attributes.description,
    source: 'Saved Query',
  };
};

export const transformSavedSearchToSnippet = (savedSearch: any): QuerySnippetItem => {
  let query;
  try {
    const searchSourceJSON = savedSearch.attributes.kibanaSavedObjectMeta?.searchSourceJSON;
    query = searchSourceJSON ? JSON.parse(searchSourceJSON)?.query : undefined;
  } catch (e) {
    query = undefined;
  }

  return {
    id: savedSearch.id,
    query,
    title: savedSearch.attributes.title,
    description: savedSearch.attributes.description,
    source: 'Saved Search',
  };
};

export const transformRecentQueryToSnippet = (historyItem: any): QuerySnippetItem => {
  return {
    id: historyItem.id,
    query: historyItem.query,
    timestamp: historyItem.time,
    source: 'Recent Query',
  };
};

const getAllSavedQueries = async (queryService: IQueryStart, language: string) => {
  const savedQueries = await queryService.savedQueries.getAllSavedQueries();
  return savedQueries
    .filter((savedQuery: SavedQuery) => {
      const savedQueryLanguage = savedQuery.attributes.query.language?.toLowerCase();
      return savedQueryLanguage === language.toLowerCase();
    })
    .map(transformSavedQueryToSnippet);
};

const getAllSavedSearches = async (language: string) => {
  const savedObjects = getSavedObjects();
  const response = await savedObjects.client.find({
    type: 'explore',
    perPage: 1000,
    page: 1,
  });

  const savedSearches = response.savedObjects.map(transformSavedSearchToSnippet);

  return savedSearches.filter((savedSearch: QuerySnippetItem) => {
    const searchLanguage = savedSearch.query?.language?.toLowerCase();
    return searchLanguage === language.toLowerCase();
  });
};

const getAllRecentQueries = async (queryService: IQueryStart, language: string) => {
  const recentQueries = queryService.queryString.getQueryHistory();
  return recentQueries
    .filter((historyItem: any) => {
      const recentQueryLanguage = historyItem.query.language?.toLowerCase();
      return recentQueryLanguage === language.toLowerCase();
    })
    .map(transformRecentQueryToSnippet);
};

export const getUserPastQueries = async (language: string): Promise<QuerySnippetItem[]> => {
  const queryService = getQueryService();

  const [savedQueries, savedSearches, recentQueries] = await Promise.all([
    getAllSavedQueries(queryService, language),
    getAllSavedSearches(language),
    getAllRecentQueries(queryService, language),
  ]);

  return [...savedQueries, ...savedSearches, ...recentQueries];
};
