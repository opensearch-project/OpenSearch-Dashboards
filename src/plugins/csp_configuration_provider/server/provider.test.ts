/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchResponse } from '@opensearch-project/opensearch/api/types';
import {
  OpenSearchClientMock,
  opensearchClientMock,
} from '../../../core/server/opensearch/client/mocks';
import { OpenSearchCspClient } from './provider';

const INDEX_NAME = 'test_index';
const INDEX_DOCUMENT_NAME = 'csp_doc';
const ERROR_MESSAGE = 'Service unavailable';

describe('Provider', () => {
  let opensearchClient: OpenSearchClientMock;

  beforeEach(() => {
    jest.resetAllMocks();
    opensearchClient = opensearchClientMock.createOpenSearchClient();
  });

  afterEach(() => {});

  describe('exists', () => {
    it('returns true if the target index does exists', async () => {
      const indexExists = true;
      opensearchClient.indices.exists.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise(indexExists);
      });

      const client = new OpenSearchCspClient(opensearchClient);
      const value = await client.exists(INDEX_NAME);

      expect(value).toBeTruthy();
      expect(opensearchClient.indices.exists).toBeCalledWith({ index: INDEX_NAME });
    });

    it('returns false if the target index does not exists', async () => {
      const indexExists = false;
      opensearchClient.indices.exists.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise(indexExists);
      });

      const client = new OpenSearchCspClient(opensearchClient);
      const existsValue = await client.exists(INDEX_NAME);

      expect(existsValue).toBeFalsy();
      expect(opensearchClient.indices.exists).toBeCalledWith({ index: INDEX_NAME });
    });

    it('returns false if opensearch errors happen', async () => {
      opensearchClient.indices.exists.mockImplementation(() => {
        return opensearchClientMock.createErrorTransportRequestPromise(new Error(ERROR_MESSAGE));
      });

      const client = new OpenSearchCspClient(opensearchClient);
      const existsValue = await client.exists(INDEX_NAME);

      expect(existsValue).toBeFalsy();
      expect(opensearchClient.indices.exists).toBeCalledWith({ index: INDEX_NAME });
    });
  });

  describe('get', () => {
    it('returns the csp rules from the index', async () => {
      const cspRules = "frame-ancestors 'self'";

      opensearchClient.search.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise({
          hits: {
            hits: [
              {
                _source: {
                  value: cspRules,
                },
              },
            ],
          },
        } as SearchResponse<any>);
      });

      const client = new OpenSearchCspClient(opensearchClient);
      const getValue = await client.get(INDEX_NAME, INDEX_DOCUMENT_NAME);

      expect(getValue).toBe(cspRules);
      expect(opensearchClient.search).toBeCalledWith(
        getSearchInput(INDEX_NAME, INDEX_DOCUMENT_NAME)
      );
    });

    it('returns empty when opensearch response is malformed', async () => {
      opensearchClient.search.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise({
          hits: {},
        } as SearchResponse<any>);
      });

      const client = new OpenSearchCspClient(opensearchClient);
      const getValue = await client.get(INDEX_NAME, INDEX_DOCUMENT_NAME);

      expect(getValue).toBe('');
      expect(opensearchClient.search).toBeCalledWith(
        getSearchInput(INDEX_NAME, INDEX_DOCUMENT_NAME)
      );
    });

    it('returns empty when value field is missing in opensearch response', async () => {
      const cspRules = "frame-ancestors 'self'";

      opensearchClient.search.mockImplementation(() => {
        return opensearchClientMock.createSuccessTransportRequestPromise({
          hits: {
            hits: [
              {
                _source: {
                  value_typo: cspRules,
                },
              },
            ],
          },
        } as SearchResponse<any>);
      });

      const client = new OpenSearchCspClient(opensearchClient);
      const getValue = await client.get(INDEX_NAME, INDEX_DOCUMENT_NAME);

      expect(getValue).toBe('');
      expect(opensearchClient.search).toBeCalledWith(
        getSearchInput(INDEX_NAME, INDEX_DOCUMENT_NAME)
      );
    });

    it('returns empty string when opensearch errors happen', async () => {
      opensearchClient.search.mockImplementation(() => {
        return opensearchClientMock.createErrorTransportRequestPromise(new Error(ERROR_MESSAGE));
      });

      const client = new OpenSearchCspClient(opensearchClient);
      const cspRules = await client.get(INDEX_NAME, INDEX_DOCUMENT_NAME);

      expect(cspRules).toBe('');
      expect(opensearchClient.search).toBeCalledWith(
        getSearchInput(INDEX_NAME, INDEX_DOCUMENT_NAME)
      );
    });
  });
});

function getSearchInput(indexName: string, documentName: string) {
  return {
    index: indexName,
    body: {
      query: {
        match: {
          _id: {
            query: documentName,
          },
        },
      },
    },
  };
}
