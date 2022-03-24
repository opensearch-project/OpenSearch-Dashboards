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
import { getClusterInfo } from './get_cluster_info';

export function mockGetClusterInfo(clusterInfo: any) {
  const opensearchClient = opensearchServiceMock.createClusterClient().asInternalUser;
  opensearchClient.info
    // @ts-ignore we only care about the response body
    .mockResolvedValue(
      // @ts-ignore we only care about the response body
      {
        body: { ...clusterInfo },
      }
    );
  return opensearchClient;
}

describe('get_cluster_info using the opensearch client', () => {
  it('uses the opensearchClient to get info API', async () => {
    const clusterInfo = {
      cluster_uuid: '1234',
      cluster_name: 'testCluster',
      version: {
        number: '7.9.2',
        build_flavor: 'default',
        build_type: 'docker',
        build_hash: 'b5ca9c58fb664ca8bf',
        build_date: '2020-07-21T16:40:44.668009Z',
        build_snapshot: false,
        lucene_version: '8.5.1',
        minimum_wire_compatibility_version: '6.8.0',
        minimum_index_compatibility_version: '6.0.0-beta1',
      },
    };
    const opensearchClient = mockGetClusterInfo(clusterInfo);

    expect(await getClusterInfo(opensearchClient)).toStrictEqual(clusterInfo);
  });
});
