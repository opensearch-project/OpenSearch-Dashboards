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
import { migrationRetryCallClusterMock } from './migration_opensearch_client.test.mock';

import {
  createMigrationOpenSearchClient,
  MigrationOpenSearchClient,
} from './migration_opensearch_client';
import { opensearchClientMock } from '../../../opensearch/client/mocks';
import { loggerMock } from '../../../logging/logger.mock';
import { SavedObjectsErrorHelpers } from '../../service/lib/errors';

describe('MigrationOpenSearchClient', () => {
  let client: ReturnType<typeof opensearchClientMock.createOpenSearchClient>;
  let migrationOpenSearchClient: MigrationOpenSearchClient;

  beforeEach(() => {
    client = opensearchClientMock.createOpenSearchClient();
    migrationOpenSearchClient = createMigrationOpenSearchClient(client, loggerMock.create());
    migrationRetryCallClusterMock.mockClear();
  });

  it('delegates call to OpenSearch client method', async () => {
    expect(migrationOpenSearchClient.bulk).toStrictEqual(expect.any(Function));
    await migrationOpenSearchClient.bulk({ body: [] });
    expect(client.bulk).toHaveBeenCalledTimes(1);
  });

  it('wraps a method call in migrationRetryCallClusterMock', async () => {
    await migrationOpenSearchClient.bulk({ body: [] });
    expect(migrationRetryCallClusterMock).toHaveBeenCalledTimes(1);
  });

  it('sets maxRetries: 0 to delegate retry logic to migrationRetryCallCluster', async () => {
    expect(migrationOpenSearchClient.bulk).toStrictEqual(expect.any(Function));
    await migrationOpenSearchClient.bulk({ body: [] });
    expect(client.bulk).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ maxRetries: 0 })
    );
  });

  it('do not transform opensearch errors into saved objects errors', async () => {
    expect.assertions(1);
    client.bulk = jest.fn().mockRejectedValue(new Error('reason'));
    try {
      await migrationOpenSearchClient.bulk({ body: [] });
    } catch (e) {
      expect(SavedObjectsErrorHelpers.isSavedObjectsClientError(e)).toBe(false);
    }
  });
});
