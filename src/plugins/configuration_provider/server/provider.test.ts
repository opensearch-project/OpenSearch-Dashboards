/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ScopedClusterClientMock,
  opensearchClientMock,
} from '../../../core/server/opensearch/client/mocks';
import { OpenSearchConfigurationClient } from './provider';
import { MockedLogger, loggerMock } from '@osd/logging/target/mocks';
import { GetResponse } from 'src/core/server';
import { ResponseError } from '@opensearch-project/opensearch/lib/errors';

const INDEX_NAME = 'test_index';
const INDEX_DOCUMENT_NAME = 'csp.rules';
const ERROR_MESSAGE = 'Service unavailable';

describe('OpenSearchConfigurationClient', () => {
  let opensearchClient: ScopedClusterClientMock;
  let logger: MockedLogger;

  beforeEach(() => {
    jest.resetAllMocks();
    opensearchClient = opensearchClientMock.createScopedClusterClient();
    logger = loggerMock.create();
  });

  afterEach(() => {});

  describe('existsCspRules', () => {
    it('returns true if the target index does exists', async () => {
      const indexExists = true;
      opensearchClient.asInternalUser.exists.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise(indexExists);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);
      const value = await client.existsCspRules();

      expect(value).toBeTruthy();

      expect(opensearchClient.asInternalUser.exists).toBeCalledWith({
        index: INDEX_NAME,
        id: INDEX_DOCUMENT_NAME,
      });

      expect(logger.error).not.toBeCalled();
    });

    it('returns false if the target index does not exists', async () => {
      const indexExists = false;
      opensearchClient.asInternalUser.exists.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise(indexExists);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);
      const existsValue = await client.existsCspRules();

      expect(existsValue).toBeFalsy();

      expect(opensearchClient.asInternalUser.exists).toBeCalledWith({
        index: INDEX_NAME,
        id: INDEX_DOCUMENT_NAME,
      });

      expect(logger.error).not.toBeCalled();
    });

    it('throws error if opensearch errors happen', async () => {
      const error = new Error(ERROR_MESSAGE);

      opensearchClient.asInternalUser.exists.mockImplementation(() => {
        return opensearchClientMock.createErrorTransportRequestPromise(error);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      await expect(client.existsCspRules()).rejects.toThrowError(ERROR_MESSAGE);

      expect(opensearchClient.asInternalUser.exists).toBeCalledWith({
        index: INDEX_NAME,
        id: INDEX_DOCUMENT_NAME,
      });

      expect(logger.error).toBeCalledWith(`Failed to call cspRulesExists due to error ${error}`);
    });
  });

  describe('getCspRules', () => {
    it('returns the csp rules from the index', async () => {
      const cspRules = "frame-ancestors 'self'";

      opensearchClient.asInternalUser.get.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise({
          _source: {
            value: cspRules,
          },
        } as GetResponse<any>);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);
      const getValue = await client.getCspRules();

      expect(getValue).toBe(cspRules);

      expect(opensearchClient.asInternalUser.get).toBeCalledWith({
        index: INDEX_NAME,
        id: INDEX_DOCUMENT_NAME,
      });

      expect(logger.error).not.toBeCalled();
    });

    it('throws error when opensearch response is malformed', async () => {
      opensearchClient.asInternalUser.get.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise({
          _index: INDEX_NAME,
        } as GetResponse<any>);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      await expect(client.getCspRules()).rejects.toThrowError();

      expect(opensearchClient.asInternalUser.get).toBeCalledWith({
        index: INDEX_NAME,
        id: INDEX_DOCUMENT_NAME,
      });

      expect(logger.error).toBeCalledWith(
        "Failed to call getCspRules due to error TypeError: Cannot read properties of undefined (reading 'value')"
      );
    });

    it('returns empty when value field is missing in opensearch response', async () => {
      const cspRules = "frame-ancestors 'self'";

      opensearchClient.asInternalUser.get.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise({
          _source: {
            value_typo: cspRules,
          },
        } as GetResponse<any>);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);
      const getValue = await client.getCspRules();

      expect(getValue).toBe('');

      expect(opensearchClient.asInternalUser.get).toBeCalledWith({
        index: INDEX_NAME,
        id: INDEX_DOCUMENT_NAME,
      });

      expect(logger.error).not.toBeCalled();
    });

    it('throws error when opensearch errors happen', async () => {
      const error = new Error(ERROR_MESSAGE);

      opensearchClient.asInternalUser.get.mockImplementation(() => {
        return opensearchClientMock.createErrorTransportRequestPromise(error);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      await expect(client.getCspRules()).rejects.toThrowError(ERROR_MESSAGE);

      expect(opensearchClient.asInternalUser.get).toBeCalledWith({
        index: INDEX_NAME,
        id: INDEX_DOCUMENT_NAME,
      });

      expect(logger.error).toBeCalledWith(`Failed to call getCspRules due to error ${error}`);
    });
  });

  describe('updateCspRules', () => {
    it('runs updated value when opensearch successfully updates', async () => {
      const cspRules = "frame-ancestors 'self'";

      opensearchClient.asCurrentUser.index.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise({});
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      const updated = await client.updateCspRules(cspRules);

      expect(updated).toBe(cspRules);

      expect(opensearchClient.asCurrentUser.index).toBeCalledWith(
        getIndexInput(INDEX_NAME, INDEX_DOCUMENT_NAME, cspRules)
      );

      expect(logger.error).not.toBeCalled();
    });

    it('throws exception when opensearch throws exception', async () => {
      const cspRules = "frame-ancestors 'self'";
      const error = new Error(ERROR_MESSAGE);
      opensearchClient.asCurrentUser.index.mockImplementation(() => {
        return opensearchClientMock.createErrorTransportRequestPromise(error);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      await expect(client.updateCspRules(cspRules)).rejects.toThrowError(ERROR_MESSAGE);

      expect(opensearchClient.asCurrentUser.index).toBeCalledWith(
        getIndexInput(INDEX_NAME, INDEX_DOCUMENT_NAME, cspRules)
      );

      expect(logger.error).toBeCalledWith(
        `Failed to call updateCspRules with cspRules ${cspRules} due to error ${error}`
      );
    });
  });

  describe('deleteCspRules', () => {
    it('return deleted document ID when deletion succeeds', async () => {
      opensearchClient.asCurrentUser.delete.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise({});
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);
      const deleted = await client.deleteCspRules();

      expect(deleted).toBe(INDEX_DOCUMENT_NAME);

      expect(opensearchClient.asCurrentUser.delete).toBeCalledWith({
        index: INDEX_NAME,
        id: INDEX_DOCUMENT_NAME,
      });

      expect(logger.error).not.toBeCalled();
    });

    it('throws exception when opensearch throws exception', async () => {
      const error = new Error(ERROR_MESSAGE);

      opensearchClient.asCurrentUser.delete.mockImplementation(() => {
        return opensearchClientMock.createErrorTransportRequestPromise(error);
      });

      const client = new OpenSearchConfigurationClient(opensearchClient, INDEX_NAME, logger);

      await expect(client.deleteCspRules()).rejects.toThrowError(ERROR_MESSAGE);

      expect(opensearchClient.asCurrentUser.delete).toBeCalledWith({
        index: INDEX_NAME,
        id: INDEX_DOCUMENT_NAME,
      });

      expect(logger.error).toBeCalledWith(`Failed to call deleteCspRules due to error ${error}`);
    });

    it('return deleted document ID when deletion fails due to index not found', async () => {
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
      const deletedCspRulesName = await client.deleteCspRules();

      expect(deletedCspRulesName).toBe(INDEX_DOCUMENT_NAME);

      expect(opensearchClient.asCurrentUser.delete).toBeCalledWith({
        index: INDEX_NAME,
        id: INDEX_DOCUMENT_NAME,
      });

      expect(logger.error).not.toBeCalled();
    });

    it('return deleted document ID when deletion fails due to document not found', async () => {
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
      const deletedCspRulesName = await client.deleteCspRules();

      expect(deletedCspRulesName).toBe(INDEX_DOCUMENT_NAME);

      expect(opensearchClient.asCurrentUser.delete).toBeCalledWith({
        index: INDEX_NAME,
        id: INDEX_DOCUMENT_NAME,
      });

      expect(logger.error).not.toBeCalled();
    });
  });
});

function getIndexInput(indexName: string, documentName: string, cspRules: string) {
  return {
    index: indexName,
    id: documentName,
    body: {
      value: cspRules,
    },
  };
}
