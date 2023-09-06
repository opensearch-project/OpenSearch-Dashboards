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

import { opensearchClientMock } from './mocks';
import { ScopedClusterClient } from './scoped_cluster_client';

describe('ScopedClusterClient', () => {
  it('uses the internal client passed in the constructor', () => {
    const internalClient = opensearchClientMock.createOpenSearchClient();
    const scopedClient = opensearchClientMock.createOpenSearchClient();

    const internalClientWithLongNumeralsSupport = opensearchClientMock.createOpenSearchClient({
      withLongNumeralsSupport: true,
    });
    const scopedClientWithLongNumeralsSupport = opensearchClientMock.createOpenSearchClient({
      withLongNumeralsSupport: true,
    });

    const scopedClusterClient = new ScopedClusterClient(
      internalClient,
      scopedClient,
      internalClientWithLongNumeralsSupport,
      scopedClientWithLongNumeralsSupport
    );

    expect(scopedClusterClient.asInternalUser).toBe(internalClient);
    expect(scopedClusterClient.asInternalUserWithLongNumeralsSupport).toBe(
      internalClientWithLongNumeralsSupport
    );
  });

  it('uses the scoped client passed in the constructor', () => {
    const internalClient = opensearchClientMock.createOpenSearchClient();
    const scopedClient = opensearchClientMock.createOpenSearchClient();

    const internalClientWithLongNumeralsSupport = opensearchClientMock.createOpenSearchClient({
      withLongNumeralsSupport: true,
    });
    const scopedClientWithLongNumeralsSupport = opensearchClientMock.createOpenSearchClient({
      withLongNumeralsSupport: true,
    });

    const scopedClusterClient = new ScopedClusterClient(
      internalClient,
      scopedClient,
      internalClientWithLongNumeralsSupport,
      scopedClientWithLongNumeralsSupport
    );

    expect(scopedClusterClient.asCurrentUser).toBe(scopedClient);
    expect(scopedClusterClient.asCurrentUserWithLongNumeralsSupport).toBe(
      scopedClientWithLongNumeralsSupport
    );
  });
});
