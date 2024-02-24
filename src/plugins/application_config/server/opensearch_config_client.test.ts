/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseError } from '@opensearch-project/opensearch/lib/errors';
import {
  ScopedClusterClientMock,
  opensearchClientMock,
} from '../../../core/server/opensearch/client/mocks';
import { OpenSearchConfigurationClient } from './opensearch_config_client';
import { MockedLogger, loggerMock } from '@osd/logging/target/mocks';

const INDEX_NAME = 'test_index';
const ERROR_MESSAGE = 'Service unavailable';

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

    it('throws error when opensearch errors happen', async () => {
      const error = new Error(ERROR_MESSAGE);

      opensearchClient.asInternalUser.search.mockImplementation(() => {
        return opensearchClientMock.createErrorTransportRequestPromise(error);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      await expect(client.getConfig()).rejects.toThrowError(ERROR_MESSAGE);
    });
  });

  describe('getEntityConfig', () => {
    it('return configuration value from the document in the index', async () => {
      opensearchClient.asInternalUser.get.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise({
          _source: {
            value: 'value1',
          },
        });
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      const value = await client.getEntityConfig('config1');

      expect(value).toBe('value1');
    });

    it('throws error when opensearch errors happen', async () => {
      const error = new Error(ERROR_MESSAGE);

      opensearchClient.asInternalUser.get.mockImplementation(() => {
        return opensearchClientMock.createErrorTransportRequestPromise(error);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      await expect(client.getEntityConfig('config1')).rejects.toThrowError(ERROR_MESSAGE);
    });
  });

  describe('deleteEntityConfig', () => {
    it('return deleted entity when opensearch deletes successfully', async () => {
      opensearchClient.asCurrentUser.delete.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise({});
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      const value = await client.deleteEntityConfig('config1');

      expect(value).toBe('config1');
    });

    it('return deleted document entity when deletion fails due to index not found', async () => {
      const error = new ResponseError({
        statusCode: 401,
        body: {
          error: {
            type: 'index_not_found_exception',
          },
        },
        warnings: [],
        headers: {
          'WWW-Authenticate': 'content',
        },
        meta: {} as any,
      });

      opensearchClient.asCurrentUser.delete.mockImplementation(() => {
        return opensearchClientMock.createErrorTransportRequestPromise(error);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      const value = await client.deleteEntityConfig('config1');

      expect(value).toBe('config1');
    });

    it('return deleted document entity when deletion fails due to document not found', async () => {
      const error = new ResponseError({
        statusCode: 401,
        body: {
          result: 'not_found',
        },
        warnings: [],
        headers: {
          'WWW-Authenticate': 'content',
        },
        meta: {} as any,
      });

      opensearchClient.asCurrentUser.delete.mockImplementation(() => {
        return opensearchClientMock.createErrorTransportRequestPromise(error);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      const value = await client.deleteEntityConfig('config1');

      expect(value).toBe('config1');
    });

    it('throws error when opensearch throws error', async () => {
      const error = new Error(ERROR_MESSAGE);

      opensearchClient.asCurrentUser.delete.mockImplementation(() => {
        return opensearchClientMock.createErrorTransportRequestPromise(error);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      await expect(client.deleteEntityConfig('config1')).rejects.toThrowError(ERROR_MESSAGE);
    });
  });

  describe('updateEntityConfig', () => {
    it('returns updated value when opensearch updates successfully', async () => {
      opensearchClient.asCurrentUser.index.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise({});
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      const value = await client.updateEntityConfig('config1', 'newValue1');

      expect(value).toBe('newValue1');
    });

    it('throws error when opensearch throws error', async () => {
      const error = new Error(ERROR_MESSAGE);

      opensearchClient.asCurrentUser.index.mockImplementation(() => {
        return opensearchClientMock.createErrorTransportRequestPromise(error);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      await expect(client.updateEntityConfig('config1', 'newValue1')).rejects.toThrowError(
        ERROR_MESSAGE
      );
    });
  });
});
