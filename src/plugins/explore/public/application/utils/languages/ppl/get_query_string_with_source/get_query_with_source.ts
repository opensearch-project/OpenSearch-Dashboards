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
  const hasSource = /^[^|]*\bsource\s*=/.test(lowerCaseQuery);
  const hasDescribe = /^\s*describe\s+/.test(lowerCaseQuery);
  const hasShow = /^\s*show\s+/.test(lowerCaseQuery);

  // Temporarily adding backticks to dataset type INDEXES or INDEX_PATTERNS to until these two issues are resolved:
  // https://github.com/opensearch-project/sql/issues/4444
  // https://github.com/opensearch-project/sql/issues/4445
  let datasetTitle: string;
  if (query.dataset && ['INDEXES', 'INDEX_PATTERN'].includes(query.dataset.type)) {
    if (hasSource) {
      // Replace source=anything with source=`anything` (handling spaces around = and ensuring anything is not already backticked)
      const updatedQuery = queryString.replace(/(\bsource\s*=\s*)([^`\s][^\s]*)/gi, '$1`$2`');
      return { ...query, query: updatedQuery };
    }

    datasetTitle = `\`${query.dataset.title}\``;
  } else {
    datasetTitle = query.dataset?.title || '';
  }

  if (hasSource || hasDescribe || hasShow) {
    return { ...query, query: queryString };
  }

  let queryStringWithSource: string;
  if (queryString.trim() === '') {
    queryStringWithSource = `source = ${datasetTitle}`;
  } else {
    queryStringWithSource = `source = ${datasetTitle} ${queryString}`;
  }

  return {
    ...query,
    query: queryStringWithSource,
  };
};
