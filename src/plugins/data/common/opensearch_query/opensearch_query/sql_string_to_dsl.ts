/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isString } from 'lodash';
import { DslQuery } from './opensearch_query_dsl';

export function getIndexPatternFromSql(query: string | any) {
  const from = query.match(new RegExp(/FROM\s+([\w*-.!@$^()~;]+)/, 'i'));
  if (from) {
    return from[1];
  }
  return '';
}

export function sqlStringToDsl(query: string | any): DslQuery {
  if (isString(query)) {
    return { query_string: { query } };
  }

  return query;
}
