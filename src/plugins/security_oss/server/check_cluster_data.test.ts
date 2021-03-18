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

import { opensearchServiceMock, loggingSystemMock } from '../../../core/server/mocks';
import { createClusterDataCheck } from './check_cluster_data';

describe('checkClusterForUserData', () => {
  it('returns false if no data is found', async () => {
    const opensearchClient = opensearchServiceMock.createOpenSearchClient();
    opensearchClient.cat.indices.mockResolvedValue(
      opensearchServiceMock.createApiResponse({ body: [] })
    );

    const log = loggingSystemMock.createLogger();

    const response = await createClusterDataCheck()(opensearchClient, log);
    expect(response).toEqual(false);
    expect(opensearchClient.cat.indices).toHaveBeenCalledTimes(1);
  });

  it('returns false if data only exists in system indices', async () => {
    const opensearchClient = opensearchServiceMock.createOpenSearchClient();
    opensearchClient.cat.indices.mockResolvedValue(
      opensearchServiceMock.createApiResponse({
        body: [
          {
            index: '.opensearch_dashboards',
            'docs.count': 500,
          },
          {
            index: 'opensearch_dashboards_sample_ecommerce_data',
            'docs.count': 20,
          },
          {
            index: '.somethingElse',
            'docs.count': 20,
          },
        ],
      })
    );

    const log = loggingSystemMock.createLogger();

    const response = await createClusterDataCheck()(opensearchClient, log);
    expect(response).toEqual(false);
    expect(opensearchClient.cat.indices).toHaveBeenCalledTimes(1);
  });

  it('returns true if data exists in non-system indices', async () => {
    const opensearchClient = opensearchServiceMock.createOpenSearchClient();
    opensearchClient.cat.indices.mockResolvedValue(
      opensearchServiceMock.createApiResponse({
        body: [
          {
            index: '.opensearch_dashboards',
            'docs.count': 500,
          },
          {
            index: 'some_real_index',
            'docs.count': 20,
          },
        ],
      })
    );

    const log = loggingSystemMock.createLogger();

    const response = await createClusterDataCheck()(opensearchClient, log);
    expect(response).toEqual(true);
  });

  it('checks each time until the first true response is returned, then stops checking', async () => {
    const opensearchClient = opensearchServiceMock.createOpenSearchClient();
    opensearchClient.cat.indices
      .mockResolvedValueOnce(
        opensearchServiceMock.createApiResponse({
          body: [],
        })
      )
      .mockRejectedValueOnce(new Error('something terrible happened'))
      .mockResolvedValueOnce(
        opensearchServiceMock.createApiResponse({
          body: [
            {
              index: '.opensearch_dashboards',
              'docs.count': 500,
            },
          ],
        })
      )
      .mockResolvedValueOnce(
        opensearchServiceMock.createApiResponse({
          body: [
            {
              index: 'some_real_index',
              'docs.count': 20,
            },
          ],
        })
      );

    const log = loggingSystemMock.createLogger();

    const doesClusterHaveUserData = createClusterDataCheck();

    let response = await doesClusterHaveUserData(opensearchClient, log);
    expect(response).toEqual(false);

    response = await doesClusterHaveUserData(opensearchClient, log);
    expect(response).toEqual(false);

    response = await doesClusterHaveUserData(opensearchClient, log);
    expect(response).toEqual(false);

    response = await doesClusterHaveUserData(opensearchClient, log);
    expect(response).toEqual(true);

    expect(opensearchClient.cat.indices).toHaveBeenCalledTimes(4);
    expect(log.warn.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "Error encountered while checking cluster for user data: Error: something terrible happened",
        ],
      ]
    `);

    response = await doesClusterHaveUserData(opensearchClient, log);
    expect(response).toEqual(true);
    // Same number of calls as above. We should not have to interrogate again.
    expect(opensearchClient.cat.indices).toHaveBeenCalledTimes(4);
  });
});
