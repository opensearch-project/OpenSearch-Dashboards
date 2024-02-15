/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { decorateQuery } from './decorate_query';
import { getIndexPatternFromSql, sqlStringToDsl } from './sql_string_to_dsl';
import { Query } from '../../query/types';

export function buildQueryFromSql(queries: Query[], dateFormatTZ?: string) {
  const combinedQueries = (queries || []).map((query) => {
    const indexPattern = getIndexPatternFromSql(query.query);
    const queryDsl = sqlStringToDsl(query.query);

    return decorateQuery(queryDsl, indexPattern, dateFormatTZ);
  });

  return {
    combinedQueries,
  };
}
