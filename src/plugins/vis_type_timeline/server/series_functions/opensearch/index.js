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

import { i18n } from '@osd/i18n';
import _ from 'lodash';
import { OPENSEARCH_SEARCH_STRATEGY } from '../../../../data/server';
import Datasource from '../../lib/classes/datasource';
import buildRequest from './lib/build_request';
import toSeriesList from './lib/agg_response_to_series_list';

export default new Datasource('es', {
  args: [
    {
      name: 'q',
      types: ['string', 'null'],
      multi: true,
      help: i18n.translate('timeline.help.functions.opensearch.args.qHelpText', {
        defaultMessage: 'Query in lucene query string syntax',
      }),
    },
    {
      name: 'metric',
      types: ['string', 'null'],
      multi: true,
      help: i18n.translate('timeline.help.functions.opensearch.args.metricHelpText', {
        defaultMessage:
          'An opensearch metric agg: avg, sum, min, max, percentiles or cardinality, followed by a field. ' +
          'E.g., "sum:bytes", "percentiles:bytes:95,99,99.9" or just "count"',
        description:
          `avg, sum, min, max, percentiles and cardinality are keywords in the expression ` +
          `and must not be translated. Also don't translate the examples.`,
      }),
    },
    {
      name: 'split',
      types: ['string', 'null'],
      multi: true,
      help: i18n.translate('timeline.help.functions.opensearch.args.splitHelpText', {
        defaultMessage:
          'An opensearch field to split the series on and a limit. E.g., "{hostnameSplitArg}" to get the top 10 hostnames',
        values: {
          hostnameSplitArg: 'hostname:10',
        },
      }),
    },
    {
      name: 'index',
      types: ['string', 'null'],
      help: i18n.translate('timeline.help.functions.opensearch.args.indexHelpText', {
        defaultMessage:
          'Index to query, wildcards accepted. Provide Index Pattern name for scripted fields and ' +
          'field name type ahead suggestions for metrics, split, and timefield arguments.',
        description:
          '"metrics", "split" and "timefield" are referring to parameter names and should not be translated.',
      }),
    },
    {
      name: 'timefield',
      types: ['string', 'null'],
      help: i18n.translate('timeline.help.functions.opensearch.args.timefieldHelpText', {
        defaultMessage: 'Field of type "date" to use for x-axis',
        description: '"date" is a field type and should not be translated.',
      }),
    },
    {
      name: 'kibana',
      types: ['boolean', 'null'],
      help: i18n.translate('timeline.help.functions.opensearch.args.opensearchDashboardsHelpText', {
        defaultMessage:
          'Respect filters on OpenSearch Dashboards dashboards. Only has an effect when using on OpenSearch Dashboards dashboards',
      }),
    },
    {
      name: 'opensearchDashboards',
      types: ['boolean', 'null'],
      help: i18n.translate('timeline.help.functions.opensearch.args.opensearchDashboardsHelpText', {
        defaultMessage:
          'Respect filters on OpenSearch Dashboards dashboards. Only has an effect when using on OpenSearch Dashboards dashboards',
      }),
    },
    {
      name: 'interval', // You really shouldn't use this, use the interval picker instead
      types: ['string', 'null'],
      help: i18n.translate('timeline.help.functions.opensearch.args.intervalHelpText', {
        defaultMessage: `**DO NOT USE THIS**. It's fun for debugging fit functions, but you really should use the interval picker`,
      }),
    },
  ],
  help: i18n.translate('timeline.help.functions.opensearchHelpText', {
    defaultMessage: 'Pull data from an opensearch instance',
  }),
  aliases: ['elasticsearch', 'opensearch'],
  fn: async function opensearchFn(args, tlConfig) {
    const config = _.defaults(_.clone(args.byName), {
      q: '*',
      metric: ['count'],
      index: tlConfig.settings['timeline:es.default_index'],
      timefield: tlConfig.settings['timeline:es.timefield'],
      interval: tlConfig.time.interval,
      kibana: true,
      opensearchDashboards: true,
      fit: 'nearest',
    });

    const findResp = await tlConfig.savedObjectsClient.find({
      type: 'index-pattern',
      fields: ['title', 'fields'],
      search: `"${config.index}"`,
      search_fields: ['title'],
    });
    const indexPatternSavedObject = findResp.saved_objects.find((savedObject) => {
      return savedObject.attributes.title === config.index;
    });
    let scriptedFields = [];
    if (indexPatternSavedObject) {
      const fields = JSON.parse(indexPatternSavedObject.attributes.fields);
      scriptedFields = fields.filter((field) => {
        return field.scripted;
      });
    }

    const opensearchShardTimeout = tlConfig.opensearchShardTimeout;

    const body = buildRequest(config, tlConfig, scriptedFields, opensearchShardTimeout);

    const deps = (await tlConfig.getStartServices())[1];

    const resp = await deps.data.search.search(tlConfig.context, body, {
      strategy: OPENSEARCH_SEARCH_STRATEGY,
    });

    if (!resp.rawResponse._shards.total) {
      throw new Error(
        i18n.translate('timeline.serverSideErrors.opensearchFunction.indexNotFoundErrorMessage', {
          defaultMessage: 'OpenSearch index not found: {index}',
          values: {
            index: config.index,
          },
        })
      );
    }
    return {
      type: 'seriesList',
      list: toSeriesList(resp.rawResponse.aggregations, config),
    };
  },
});
