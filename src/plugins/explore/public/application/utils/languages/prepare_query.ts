/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../../data/common';
import { QueryWithQueryAsString } from './types';
import { addPPLSourceClause } from './ppl';

/**
 * Prepares a query string based on the query language.
 *
 * For PPL queries: Adds "source = <dataset>" clause if not present
 * For other languages (PromQL, etc.): Returns query as-is
 *
 * @param query - The query object containing language, query string, and dataset
 * @returns Query object with the prepared query string
 */
export const prepareQueryForLanguage = (query: Query): QueryWithQueryAsString => {
  switch (query.language) {
    case 'PPL':
      // PPL needs "source = " clause added if not present
      return addPPLSourceClause(query);

    default:
      if (typeof query.query !== 'string')
        throw new Error('Cannot convert query to QueryWithQueryAsString');
      return { ...query, query: query.query };
  }
};
