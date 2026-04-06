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

import supertest from 'supertest';
import { UnwrapPromise } from '@osd/utility-types';
import { registerDeleteRoute } from '../delete';
import { savedObjectsClientMock } from '../../../../../core/server/mocks';
import { setupServer } from '../test_utils';
import { dynamicConfigServiceMock } from '../../../config/dynamic_config_service.mock';

type SetupServerReturn = UnwrapPromise<ReturnType<typeof setupServer>>;

describe('DELETE /api/saved_objects/{type}/{id}', () => {
  let server: SetupServerReturn['server'];
  let httpSetup: SetupServerReturn['httpSetup'];
  let handlerContext: SetupServerReturn['handlerContext'];
  let savedObjectsClient: ReturnType<typeof savedObjectsClientMock.create>;

  beforeEach(async () => {
    ({ server, httpSetup, handlerContext } = await setupServer());
    savedObjectsClient = handlerContext.savedObjects.client;

    const router = httpSetup.createRouter('/api/saved_objects/');
    registerDeleteRoute(router);

    const dynamicConfigService = dynamicConfigServiceMock.createInternalStartContract();
    await server.start({ dynamicConfigService });
  });

  afterEach(async () => {
    await server.stop();
  });

  it('formats successful response', async () => {
    const result = await supertest(httpSetup.server.listener)
      .delete('/api/saved_objects/index-pattern/logstash-*')
      .expect(200);

    expect(result.body).toEqual({});
  });

  it('calls upon savedObjectClient.delete', async () => {
    savedObjectsClient.get.mockResolvedValue({
      type: 'index-pattern',
      id: 'logstash-*',
      attributes: {},
      references: [],
    } as any);

    await supertest(httpSetup.server.listener)
      .delete('/api/saved_objects/index-pattern/logstash-*')
      .expect(200);

    // force is not forwarded to client.delete() — it only controls lock bypass
    expect(savedObjectsClient.delete).toHaveBeenCalledWith('index-pattern', 'logstash-*');
  });

  it('can specify `force` option to bypass managed lock', async () => {
    await supertest(httpSetup.server.listener)
      .delete('/api/saved_objects/index-pattern/logstash-*')
      .query({ force: true })
      .expect(200);

    // force=true skips the get() lock check entirely
    expect(savedObjectsClient.get).not.toHaveBeenCalled();
    expect(savedObjectsClient.delete).toHaveBeenCalledWith('index-pattern', 'logstash-*');
  });
});
