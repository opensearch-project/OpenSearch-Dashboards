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

import { getSeriesRequestParams } from './series/get_request_params';
import { handleResponseBody } from './series/handle_response_body';
import { handleErrorResponse } from './handle_error_response';
import { getAnnotations } from './get_annotations';
import { getOpenSearchQueryConfig } from './helpers/get_opensearch_query_uisettings';
import { getActiveSeries } from './helpers/get_active_series';

export async function getSeriesData(req, panel) {
  const {
    searchStrategy,
    capabilities,
  } = await req.framework.searchStrategyRegistry.getViableStrategyForPanel(req, panel);
  const opensearchQueryConfig = await getOpenSearchQueryConfig(req);
  const meta = {
    type: panel.type,
    uiRestrictions: capabilities.uiRestrictions,
  };

  try {
    const bodiesPromises = getActiveSeries(panel).map((series) =>
      getSeriesRequestParams(req, panel, series, opensearchQueryConfig, capabilities)
    );

    const searches = (await Promise.all(bodiesPromises)).reduce(
      (acc, items) => acc.concat(items),
      []
    );

    const data = await searchStrategy.search(req, searches);

    const handleResponseBodyFn = handleResponseBody(panel);

    const series = data.map((resp) =>
      handleResponseBodyFn(resp.rawResponse ? resp.rawResponse : resp)
    );
    let annotations = null;

    if (panel.annotations && panel.annotations.length) {
      annotations = await getAnnotations({
        req,
        panel,
        series,
        opensearchQueryConfig,
        searchStrategy,
        capabilities,
      });
    }

    return {
      ...meta,
      [panel.id]: {
        annotations,
        id: panel.id,
        series: series.reduce((acc, series) => acc.concat(series), []),
      },
    };
  } catch (err) {
    if (err.body || err.name === 'DQLSyntaxError') {
      err.response = err.body;

      return {
        ...meta,
        ...handleErrorResponse(panel)(err),
      };
    }
  }
}
