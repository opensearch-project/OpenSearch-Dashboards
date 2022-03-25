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

import { BehaviorSubject } from 'rxjs';
import { UnwrapPromise } from '@osd/utility-types';

import {
  MetricsServiceSetup,
  ServiceStatus,
  ServiceStatusLevels,
} from '../../../../../core/server';
import {
  contextServiceMock,
  loggingSystemMock,
  metricsServiceMock,
} from '../../../../../core/server/mocks';
import { createHttpServer } from '../../../../../core/server/test_utils';
import { registerStatsRoute } from '../stats';
import supertest from 'supertest';
import { CollectorSet } from '../../collector';

type HttpService = ReturnType<typeof createHttpServer>;
type HttpSetup = UnwrapPromise<ReturnType<HttpService['setup']>>;

describe('/api/stats', () => {
  let server: HttpService;
  let httpSetup: HttpSetup;
  let overallStatus$: BehaviorSubject<ServiceStatus>;
  let metrics: MetricsServiceSetup;

  beforeEach(async () => {
    server = createHttpServer();
    httpSetup = await server.setup({
      context: contextServiceMock.createSetupContract(),
    });
    overallStatus$ = new BehaviorSubject<ServiceStatus>({
      level: ServiceStatusLevels.available,
      summary: 'everything is working',
    });
    metrics = metricsServiceMock.createSetupContract();

    const router = httpSetup.createRouter('');
    registerStatsRoute({
      router,
      collectorSet: new CollectorSet({
        logger: loggingSystemMock.create().asLoggerFactory().get(),
      }),
      config: {
        allowAnonymous: true,
        opensearchDashboardsIndex: '.opensearch_dashboards_test',
        opensearchDashboardsVersion: '8.8.8-SNAPSHOT',
        server: {
          name: 'myopensearchDashboards',
          hostname: 'myopensearchDashboards.com',
          port: 1234,
        },
        uuid: 'xxx-xxxxx',
      },
      metrics,
      overallStatus$,
    });

    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('successfully returns data', async () => {
    const response = await supertest(httpSetup.server.listener).get('/api/stats').expect(200);
    expect(response.body).toMatchObject({
      opensearch_dashboards: {
        uuid: 'xxx-xxxxx',
        name: 'myopensearchDashboards',
        index: '.opensearch_dashboards_test',
        host: 'myopensearchDashboards.com',
        locale: 'en',
        transport_address: `myopensearchDashboards.com:1234`,
        version: '8.8.8',
        snapshot: true,
        status: 'green',
      },
      last_updated: expect.any(String),
      collection_interval_ms: expect.any(Number),
    });
  });
});
