/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ScopedClusterClientMock,
  opensearchClientMock,
} from '../../../core/server/opensearch/client/mocks';
import { OpenSearchConfigurationClient } from './opensearch_config_client';
import { MockedLogger, loggerMock } from '@osd/logging/target/mocks';

const INDEX_NAME = 'test_index';

describe('OpenSearch Configuration Client', () => {
  let opensearchClient: ScopedClusterClientMock;
  let logger: MockedLogger;

  beforeEach(() => {
    opensearchClient = opensearchClientMock.createScopedClusterClient();
    logger = loggerMock.create();
  });

  describe('getConfig', () => {
    it('returns configurations from the index', async () => {
      opensearchClient.asInternalUser.search.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise({
          hits: {
            hits: [
              {
                _id: 'config1',
                _source: {
                  value: 'value1',
                },
              },
              {
                _id: 'config2',
                _source: {
                  value: 'value2',
                },
              },
            ],
          },
        });
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      const value = await client.getConfig();

      expect(JSON.stringify(value)).toBe(JSON.stringify({ config1: 'value1', config2: 'value2' }));
    });
  });
});
