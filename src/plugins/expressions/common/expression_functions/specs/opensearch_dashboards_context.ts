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

import { uniqBy } from 'lodash';
import { i18n } from '@osd/i18n';
import { ExpressionFunctionDefinition } from '../../expression_functions';
import { OpenSearchDashboardsContext } from '../../expression_types';
import { Query, uniqFilters } from '../../../../data/common';

interface Arguments {
  q?: string | null;
  filters?: string | null;
  timeRange?: string | null;
  savedSearchId?: string | null;
}

export type ExpressionFunctionOpenSearchDashboardsContext = ExpressionFunctionDefinition<
  'opensearch_dashboards_context',
  OpenSearchDashboardsContext | null,
  Arguments,
  Promise<OpenSearchDashboardsContext>
>;

const getParsedValue = (data: any, defaultValue: any) =>
  typeof data === 'string' && data.length ? JSON.parse(data) || defaultValue : defaultValue;

const mergeQueries = (first: Query | Query[] = [], second: Query | Query[]) =>
  uniqBy<Query>(
    [...(Array.isArray(first) ? first : [first]), ...(Array.isArray(second) ? second : [second])],
    (n: any) => JSON.stringify(n.query)
  );

export const opensearchDashboardsContextFunction: ExpressionFunctionOpenSearchDashboardsContext = {
  name: 'opensearch_dashboards_context',
  type: 'opensearch_dashboards_context',
  inputTypes: ['opensearch_dashboards_context', 'null'],
  help: i18n.translate('expressions.functions.opensearch_dashboards_context.help', {
    defaultMessage: 'Updates opensearch dashboards global context',
  }),
  args: {
    q: {
      types: ['string', 'null'],
      aliases: ['query', '_'],
      default: null,
      help: i18n.translate('expressions.functions.opensearch_dashboards_context.q.help', {
        defaultMessage: 'Specify OpenSearch Dashboards free form text query',
      }),
    },
    filters: {
      types: ['string', 'null'],
      default: '"[]"',
      help: i18n.translate('expressions.functions.opensearch_dashboards_context.filters.help', {
        defaultMessage: 'Specify OpenSearch Dashboards generic filters',
      }),
    },
    timeRange: {
      types: ['string', 'null'],
      default: null,
      help: i18n.translate('expressions.functions.opensearch_dashboards_context.timeRange.help', {
        defaultMessage: 'Specify OpenSearch Dashboards time range filter',
      }),
    },
    savedSearchId: {
      types: ['string', 'null'],
      default: null,
      help: i18n.translate(
        'expressions.functions.opensearch_dashboards_context.savedSearchId.help',
        {
          defaultMessage: 'Specify saved search ID to be used for queries and filters',
        }
      ),
    },
  },

  async fn(input, args, { getSavedObject }) {
    const timeRange = getParsedValue(args.timeRange, input?.timeRange);
    let queries = mergeQueries(input?.query, getParsedValue(args?.q, []));
    let filters = [...(input?.filters || []), ...getParsedValue(args?.filters, [])];

    if (args.savedSearchId) {
      if (typeof getSavedObject !== 'function') {
        throw new Error(
          '"getSavedObject" function not available in execution context. ' +
            'When you execute expression you need to add extra execution context ' +
            'as the third argument and provide "getSavedObject" implementation.'
        );
      }
      const obj = await getSavedObject('search', args.savedSearchId);
      const search = obj.attributes.kibanaSavedObjectMeta as {
        searchSourceJSON: string;
      };
      const { query, filter } = getParsedValue(search.searchSourceJSON, {});

      if (query) {
        queries = mergeQueries(queries, query);
      }
      if (filter) {
        filters = [...filters, ...(Array.isArray(filter) ? filter : [filter])];
      }
    }

    return {
      type: 'opensearch_dashboards_context',
      query: queries,
      filters: uniqFilters(filters).filter((f: any) => !f.meta?.disabled),
      timeRange,
    };
  },
};
