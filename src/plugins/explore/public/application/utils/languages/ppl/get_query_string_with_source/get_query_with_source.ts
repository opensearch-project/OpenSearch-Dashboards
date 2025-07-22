/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../../../data/common';
import { QueryWithQueryAsString } from '../../types';

/**
 * Adds a source if query string does not have it
 */
export const getQueryWithSource = (query: Query): QueryWithQueryAsString => {
  const queryString = typeof query.query === 'string' ? query.query : '';
  const lowerCaseQuery = queryString.toLowerCase();
  const hasSource = /^\s*(search\s+)?source\s*=/.test(lowerCaseQuery);
  const hasDescribe = /^\s*describe\s+/.test(lowerCaseQuery);
  const hasShow = /^\s*show\s+/.test(lowerCaseQuery);

  if (hasSource || hasDescribe || hasShow) {
    return { ...query, query: queryString };
  }

  const datasetTitle = query.dataset?.title || '';

  let queryStringWithSource: string;
  if (queryString.trim() === '') {
    queryStringWithSource = `source=${datasetTitle}`;
  } else {
    queryStringWithSource = `source=${datasetTitle} ${queryString}`;
  }

  return {
    ...query,
    query: queryStringWithSource,
  };
};
