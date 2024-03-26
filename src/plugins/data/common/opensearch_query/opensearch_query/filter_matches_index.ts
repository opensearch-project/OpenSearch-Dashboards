/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { uniq } from 'lodash';
import { parse, AST } from 'lucene';
import { IIndexPattern, IFieldType } from '../../index_patterns';
import { Filter, QueryStringFilter } from '../filters';

const implicitLuceneField = '<implicit>';

function getLuceneFields(ast: AST): string[] {
  const fields: string[] = [];

  // Parse left side of AST (if it exists)
  if ('left' in ast && ast.left) {
    if ('field' in ast.left) {
      if (ast.left.field && ast.left.field !== implicitLuceneField) {
        fields.push(ast.left.field);
      }
    } else {
      fields.push(...getLuceneFields(ast.left));
    }
  }

  // Parse right side of AST (if it exists)
  if ('right' in ast && ast.right) {
    if ('field' in ast.right) {
      if (ast.right.field && ast.right.field !== implicitLuceneField) {
        fields.push(ast.right.field);
      }
    } else {
      fields.push(...getLuceneFields(ast.right));
    }
  }
  return fields;
}

export function filterMatchesIndex(filter: Filter, indexPattern?: IIndexPattern | null) {
  if (!filter.meta?.key || !indexPattern) {
    return true;
  }

  if (filter.meta?.type === 'query_string') {
    const qsFilter = filter as QueryStringFilter;
    try {
      const ast = parse(qsFilter.query.query_string.query);
      const filterFields = uniq(getLuceneFields(ast));
      return filterFields.every((filterField) =>
        indexPattern.fields.some((field: IFieldType) => field.name === filterField)
      );
    } catch {
      return false;
    }
  }

  if (filter.meta?.type === 'custom') {
    return filter.meta.index === indexPattern.id;
  }

  return indexPattern.fields.some((field: IFieldType) => field.name === filter.meta.key);
}
