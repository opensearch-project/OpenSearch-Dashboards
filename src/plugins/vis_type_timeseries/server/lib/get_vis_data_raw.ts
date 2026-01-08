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

import { FakeRequest, RequestHandlerContext } from 'opensearch-dashboards/server';
import _ from 'lodash';
import { first, map } from 'rxjs/operators';
import { getPanelDataRaw } from './vis_data/get_panel_data_raw';
import { Framework } from '../plugin';
import { ReqFacade } from './search_strategies/strategies/abstract_search_strategy';

interface GetVisDataRawResponse {
  [key: string]: GetVisDataRawPanel;
}

interface GetVisDataRawPanel {
  id: string;
  series: GetVisDataRawSeries[];
}

interface GetVisDataRawSeries {
  id: string;
  label: string;
  data: GetVisDataRawDataPoint[];
}

type GetVisDataRawDataPoint = [number, number];

export interface GetVisDataOptions {
  timerange?: any;
  panels?: any;
  filters?: any;
  state?: any;
  query?: any;
}

export type GetVisDataRaw = (
  requestContext: RequestHandlerContext,
  request: FakeRequest & { body: GetVisDataOptions },
  framework: Framework
) => Promise<GetVisDataRawResponse>;

export function getVisDataRaw(
  requestContext: RequestHandlerContext,
  request: FakeRequest & { body: GetVisDataOptions },
  framework: Framework
): Promise<GetVisDataRawResponse> {
  // NOTE / TODO: This facade has been put in place to make migrating to the New Platform easier. It
  // removes the need to refactor many layers of dependencies on "req", and instead just augments the top
  // level object passed from here. The layers should be refactored fully at some point, but for now
  // this works and we are still using the New Platform services for these vis data portions.
  const reqFacade: ReqFacade = {
    requestContext,
    ...request,
    framework,
    pre: {},
    payload: request.body,
    getUiSettingsService: () => requestContext.core.uiSettings.client,
    getSavedObjectsClient: () => requestContext.core.savedObjects.client,
    getOpenSearchShardTimeout: async () => {
      return await framework.globalConfig$
        .pipe(
          first(),
          map((config) => config.opensearch.shardTimeout.asMilliseconds())
        )
        .toPromise();
    },
  };
  const panels = (reqFacade.payload as GetVisDataOptions).panels || [];
  const promises = panels.map(getPanelDataRaw(reqFacade));
  return Promise.all(promises).then((res) => {
    return res.reduce((acc, data) => {
      return _.assign(acc as any, data);
    }, {});
  }) as Promise<GetVisDataRawResponse>;
}
