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

import { buildRequestBody } from './build_request_body';
import { getOpenSearchShardTimeout } from '../helpers/get_opensearch_shard_timeout';
import { getIndexPatternObject } from '../helpers/get_index_pattern';

export async function getSeriesRequestParams(
  req,
  panel,
  series,
  opensearchQueryConfig,
  capabilities
) {
  const indexPattern =
    (series.override_index_pattern && series.series_index_pattern) || panel.index_pattern;
  const { indexPatternObject, indexPatternString } = await getIndexPatternObject(req, indexPattern);
  const request = buildRequestBody(
    req,
    panel,
    series,
    opensearchQueryConfig,
    indexPatternObject,
    capabilities
  );
  const opensearchShardTimeout = await getOpenSearchShardTimeout(req);

  return {
    index: indexPatternString,
    body: {
      ...request,
      timeout: opensearchShardTimeout > 0 ? `${opensearchShardTimeout}ms` : undefined,
    },
  };
}
