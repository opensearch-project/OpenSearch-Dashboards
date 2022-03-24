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

import { opensearchServiceMock } from '../../../../../src/core/server/mocks';
import { getClusterStats } from './get_cluster_stats';
import { TIMEOUT } from './constants';

export function mockGetClusterStats(clusterStats: any) {
  const opensearchClient = opensearchServiceMock.createClusterClient().asInternalUser;
  opensearchClient.cluster.stats.mockResolvedValue(clusterStats);
  return opensearchClient;
}

describe('get_cluster_stats', () => {
  it('uses the opensearchClient to get the response from the `cluster.stats` API', async () => {
    const response = Promise.resolve({ body: { cluster_uuid: '1234' } });
    const opensearchClient = opensearchServiceMock.createClusterClient().asInternalUser;
    opensearchClient.cluster.stats.mockImplementationOnce(
      // @ts-ignore the method only cares about the response body
      async (_params = { timeout: TIMEOUT }) => {
        return response;
      }
    );
    const result = getClusterStats(opensearchClient);
    expect(opensearchClient.cluster.stats).toHaveBeenCalledWith({ timeout: TIMEOUT });
    expect(result).toStrictEqual(response);
  });
});
