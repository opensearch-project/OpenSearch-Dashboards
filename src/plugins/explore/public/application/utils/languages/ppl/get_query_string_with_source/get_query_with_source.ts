/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../../../data/common';
import { QueryWithQueryAsString } from '../../types';

/**
 * Adds "source = <dataset>" clause to PPL query if not present
 * Also handles backtick escaping for INDEXES and INDEX_PATTERN dataset types
 */
export const addPPLSourceClause = (query: Query): QueryWithQueryAsString => {
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
      // Only apply backtick-wrapping to the source clause before the first pipe,
      // to avoid mangling field comparisons like `| where source=prod`
      const pipeIndex = queryString.indexOf('|');
      const prefix = pipeIndex === -1 ? queryString : queryString.slice(0, pipeIndex);
      const suffix = pipeIndex === -1 ? '' : queryString.slice(pipeIndex);

      // Supports:
      // - Backtick-quoted source names: source=`index1` or source=index1,`index2`
      // - Unquoted source names: source=index1
      // - Comma-separated sources with optional spaces: source=index1, index2
      // Normalizes spaces around commas to prevent leading spaces in index names
      const updatedPrefix = prefix.replace(
        /(\bsource\s*=\s*)(`[^`]+`|[^\s|,]+(?:\s*,\s*[^\s|,]+)*,?)/i,
        (_match, srcPrefix, sourceValue) => {
          if (sourceValue.includes('`')) return _match;
          // Unquoted — normalize commas and wrap in backticks
          const normalizedSource = sourceValue.replace(/\s*,\s*/g, ',');
          return `${srcPrefix}\`${normalizedSource}\``;
        }
      );
      return { ...query, query: updatedPrefix + suffix };
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
