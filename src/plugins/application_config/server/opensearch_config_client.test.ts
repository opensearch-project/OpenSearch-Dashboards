/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseError } from '@opensearch-project/opensearch/lib/errors';
import { OpenSearchConfigurationClient } from './opensearch_config_client';
import { MockedLogger, loggerMock } from '@osd/logging/target/mocks';

const INDEX_NAME = 'test_index';
const ERROR_MESSAGE = 'Service unavailable';
const ERROR_MESSSAGE_FOR_EMPTY_INPUT = 'Input cannot be empty!';
const EMPTY_INPUT = '    ';

describe('OpenSearch Configuration Client', () => {
  let logger: MockedLogger;

  beforeEach(() => {
    logger = loggerMock.create();
  });

  describe('getConfig', () => {
    it('returns configurations from the index', async () => {
      const opensearchClient = {
        asInternalUser: {
          search: jest.fn().mockImplementation(() => {
            return {
              body: {
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
              },
            };
          }),
        },
      };

      const cache = {};

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      const value = await client.getConfig();

      expect(JSON.stringify(value)).toBe(JSON.stringify({ config1: 'value1', config2: 'value2' }));
    });

    it('throws error when opensearch errors happen', async () => {
      const error = new ResponseError({
        statusCode: 401,
        body: {
          error: {
            type: ERROR_MESSAGE,
          },
        },
        warnings: [],
        headers: {
          'WWW-Authenticate': 'content',
        },
        meta: {} as any,
      });

      const opensearchClient = {
        asInternalUser: {
          search: jest.fn().mockImplementation(() => {
            throw error;
          }),
        },
      };

      const cache = {};

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      await expect(client.getConfig()).rejects.toThrowError(ERROR_MESSAGE);
    });
  });

  describe('getEntityConfig', () => {
    it('return configuration value from the document in the index', async () => {
      const opensearchClient = {
        asInternalUser: {
          get: jest.fn().mockImplementation(() => {
            return {
              body: {
                _source: {
                  value: 'value1',
                },
              },
            };
          }),
        },
      };

      const cache = {
        has: jest.fn().mockReturnValue(false),
        set: jest.fn(),
      };

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      const value = await client.getEntityConfig('config1');

      expect(value).toBe('value1');
      expect(cache.set).toBeCalledWith('config1', 'value1');
    });

    it('return configuration value from cache', async () => {
      const opensearchClient = {
        asInternalUser: {
          get: jest.fn().mockImplementation(() => {
            return {
              body: {
                _source: {
                  value: 'value1',
                },
              },
            };
          }),
        },
      };

      const cache = {
        has: jest.fn().mockReturnValue(true),
        get: jest.fn().mockReturnValue('cachedValue'),
      };

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      const value = await client.getEntityConfig('config1');

      expect(value).toBe('cachedValue');
      expect(cache.get).toBeCalledWith('config1');
    });

    it('throws error when input is empty', async () => {
      const opensearchClient = {
        asInternalUser: {
          get: jest.fn().mockImplementation(() => {
            return {
              body: {
                _source: {
                  value: 'value1',
                },
              },
            };
          }),
        },
      };

      const cache = {};

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      await expect(client.getEntityConfig(EMPTY_INPUT)).rejects.toThrowError(
        ERROR_MESSSAGE_FOR_EMPTY_INPUT
      );
    });

    it('throws error when opensearch errors happen', async () => {
      const error = new ResponseError({
        statusCode: 401,
        body: {
          error: {
            type: ERROR_MESSAGE,
          },
        },
        warnings: [],
        headers: {
          'WWW-Authenticate': 'content',
        },
        meta: {} as any,
      });

      const opensearchClient = {
        asInternalUser: {
          get: jest.fn().mockImplementation(() => {
            throw error;
          }),
        },
      };

      const cache = {
        has: jest.fn().mockReturnValue(false),
        set: jest.fn(),
      };

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      await expect(client.getEntityConfig('config1')).rejects.toThrowError(ERROR_MESSAGE);

      expect(cache.set).toBeCalledWith('config1', undefined);
    });
  });

  describe('deleteEntityConfig', () => {
    it('return deleted entity when opensearch deletes successfully', async () => {
      const opensearchClient = {
        asCurrentUser: {
          delete: jest.fn().mockImplementation(() => {
            return {};
          }),
        },
      };

      const cache = {
        del: jest.fn(),
      };

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      const value = await client.deleteEntityConfig('config1');

      expect(value).toBe('config1');
      expect(cache.del).toBeCalledWith('config1');
    });

    it('throws error when input entity is empty', async () => {
      const opensearchClient = {
        asCurrentUser: {
          delete: jest.fn().mockImplementation(() => {
            return {};
          }),
        },
      };

      const cache = {};

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      await expect(client.deleteEntityConfig(EMPTY_INPUT)).rejects.toThrowError(
        ERROR_MESSSAGE_FOR_EMPTY_INPUT
      );
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

      const opensearchClient = {
        asCurrentUser: {
          delete: jest.fn().mockImplementation(() => {
            throw error;
          }),
        },
      };

      const cache = {
        del: jest.fn(),
      };

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      const value = await client.deleteEntityConfig('config1');

      expect(value).toBe('config1');
      expect(cache.del).toBeCalledWith('config1');
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

      const opensearchClient = {
        asCurrentUser: {
          delete: jest.fn().mockImplementation(() => {
            throw error;
          }),
        },
      };

      const cache = {
        del: jest.fn(),
      };

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      const value = await client.deleteEntityConfig('config1');

      expect(value).toBe('config1');
      expect(cache.del).toBeCalledWith('config1');
    });

    it('throws error when opensearch throws error', async () => {
      const error = new ResponseError({
        statusCode: 401,
        body: {
          error: {
            type: ERROR_MESSAGE,
          },
        },
        warnings: [],
        headers: {
          'WWW-Authenticate': 'content',
        },
        meta: {} as any,
      });

      const opensearchClient = {
        asCurrentUser: {
          delete: jest.fn().mockImplementation(() => {
            throw error;
          }),
        },
      };

      const cache = {};

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      await expect(client.deleteEntityConfig('config1')).rejects.toThrowError(ERROR_MESSAGE);
    });
  });

  describe('updateEntityConfig', () => {
    it('returns updated value when opensearch updates successfully', async () => {
      const opensearchClient = {
        asCurrentUser: {
          index: jest.fn().mockImplementation(() => {
            return {};
          }),
        },
      };

      const cache = {
        set: jest.fn(),
      };

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      const value = await client.updateEntityConfig('config1', 'newValue1');

      expect(value).toBe('newValue1');
      expect(cache.set).toBeCalledWith('config1', 'newValue1');
    });

    it('throws error when entity is empty ', async () => {
      const opensearchClient = {
        asCurrentUser: {
          index: jest.fn().mockImplementation(() => {
            return {};
          }),
        },
      };

      const cache = {};

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      await expect(client.updateEntityConfig(EMPTY_INPUT, 'newValue1')).rejects.toThrowError(
        ERROR_MESSSAGE_FOR_EMPTY_INPUT
      );
    });

    it('throws error when new value is empty ', async () => {
      const opensearchClient = {
        asCurrentUser: {
          index: jest.fn().mockImplementation(() => {
            return {};
          }),
        },
      };

      const cache = {};

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      await expect(client.updateEntityConfig('config1', EMPTY_INPUT)).rejects.toThrowError(
        ERROR_MESSSAGE_FOR_EMPTY_INPUT
      );
    });

    it('throws error when opensearch throws error', async () => {
      const error = new ResponseError({
        statusCode: 401,
        body: {
          error: {
            type: ERROR_MESSAGE,
          },
        },
        warnings: [],
        headers: {
          'WWW-Authenticate': 'content',
        },
        meta: {} as any,
      });

      const opensearchClient = {
        asCurrentUser: {
          index: jest.fn().mockImplementation(() => {
            throw error;
          }),
        },
      };

      const cache = {};

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger, cache);

      await expect(client.updateEntityConfig('config1', 'newValue1')).rejects.toThrowError(
        ERROR_MESSAGE
      );
    });
  });
});
