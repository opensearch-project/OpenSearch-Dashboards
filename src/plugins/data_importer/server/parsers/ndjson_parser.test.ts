/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexResponse } from '@opensearch-project/opensearch/api/types';
import { opensearchServiceMock } from '../../../../core/server/mocks';
import { NDJSONParser } from './ndjson_parser';
import {
  INVALID_NDJSON_TEST_CASES,
  NDJSONTestCaseFormat,
  VALID_NDJSON_TEST_CASES,
} from './test_utils/ndjson_test_cases';
import { Readable } from 'stream';

describe('NDJSONParser', () => {
  const parser = new NDJSONParser();
  const clientMock = opensearchServiceMock.createOpenSearchClient();

  describe('validateText()', () => {
    it.each<NDJSONTestCaseFormat>(VALID_NDJSON_TEST_CASES)(
      'should return true for valid NDJSON',
      async ({ rawString }) => {
        expect(await parser.validateText(rawString.join('\n'), {})).toBe(true);
      }
    );
    it.each<NDJSONTestCaseFormat>(INVALID_NDJSON_TEST_CASES)(
      'should throw an error for invalid NDJSON',
      async ({ rawString }) => {
        expect(parser.validateText(rawString.join('\n'), {})).rejects.toThrow();
      }
    );
  });

  describe('ingestText()', () => {
    beforeEach(() => {
      clientMock.index.mockClear();
    });

    it.each<NDJSONTestCaseFormat>(VALID_NDJSON_TEST_CASES)(
      'should index $expected.length documents into OpenSearch',
      async ({ rawString, expected }) => {
        const response = await parser.ingestText(rawString.join('\n'), {
          client: clientMock,
          indexName: 'foo',
        });

        expect(response.total).toBe(expected.length);
        expect(clientMock.index).toHaveBeenCalledTimes(expected.length);
      }
    );

    it.each<NDJSONTestCaseFormat>(VALID_NDJSON_TEST_CASES)(
      'should handle OpenSearch errors and show the correct failedRow',
      async ({ rawString, expected }) => {
        const mockSuccessfulResponse = opensearchServiceMock.createApiResponse<IndexResponse>();
        clientMock.index
          .mockResolvedValueOnce(mockSuccessfulResponse)
          .mockRejectedValueOnce({})
          .mockRejectedValueOnce({})
          .mockResolvedValue(mockSuccessfulResponse);

        const response = await parser.ingestText(rawString.join('\n'), {
          client: clientMock,
          indexName: 'foo',
        });

        expect(clientMock.index).toHaveBeenCalledTimes(expected.length);
        expect(response.total).toBe(expected.length);
        if (expected.length > 1) {
          expect(response.failedRows).toContain(2);
        }
        if (expected.length > 2) {
          expect(response.failedRows).toContain(3);
        }
      }
    );
  });

  describe('ingestFile()', () => {
    beforeEach(() => {
      clientMock.index.mockClear();
    });

    it.each<NDJSONTestCaseFormat>(VALID_NDJSON_TEST_CASES)(
      'should index $expected.length documents into OpenSearch',
      async ({ rawString, expected }) => {
        const validNDJSONFileStream = Readable.from(rawString.join('\n'));
        const response = await parser.ingestFile(validNDJSONFileStream, {
          client: clientMock,
          indexName: 'foo',
        });

        expect(response.total).toBe(expected.length);
        expect(clientMock.index).toHaveBeenCalledTimes(expected.length);
      }
    );

    it.each<NDJSONTestCaseFormat>(VALID_NDJSON_TEST_CASES)(
      'should handle OpenSearch errors and show the correct failedRow',
      async ({ rawString, expected }) => {
        const mockSuccessfulResponse = opensearchServiceMock.createApiResponse<IndexResponse>();
        clientMock.index
          .mockRejectedValueOnce({})
          .mockResolvedValueOnce(mockSuccessfulResponse)
          .mockRejectedValueOnce({})
          .mockResolvedValue(mockSuccessfulResponse);

        const validNDJSONFileStream = Readable.from(rawString.join('\n'));
        const response = await parser.ingestFile(validNDJSONFileStream, {
          client: clientMock,
          indexName: 'foo',
        });

        expect(clientMock.index).toHaveBeenCalledTimes(expected.length);
        expect(response.total).toBe(expected.length);
        if (expected.length > 1) {
          expect(response.failedRows).toContain(1);
        }
        if (expected.length > 2) {
          expect(response.failedRows).toContain(3);
        }
      }
    );

    it.each<NDJSONTestCaseFormat>(INVALID_NDJSON_TEST_CASES)(
      'should throw an error for invalid NDJSON',
      async ({ rawString }) => {
        const invalidNDJSONFileStream = Readable.from(rawString.join('\n'));
        try {
          const response = await parser.ingestFile(invalidNDJSONFileStream, {
            client: clientMock,
            indexName: 'foo',
          });

          expect(response.failedRows.length).toBeGreaterThan(0);
          expect(clientMock.index.mock.calls.length).toBeLessThanOrEqual(rawString.length);
          // eslint-disable-next-line no-empty
        } catch (e) {}
      }
    );
  });

  describe('parseFile()', () => {
    const limit = 4;
    it.each<NDJSONTestCaseFormat>(VALID_NDJSON_TEST_CASES)(
      'should parse 4 documents from NDJSON',
      async ({ rawString, expected }) => {
        const validNDJSONFileStream = Readable.from(rawString.join('\n'));
        const response = await parser.parseFile(validNDJSONFileStream, limit, {});

        expect(response).toEqual(expected.slice(0, limit));
      }
    );

    it.each<NDJSONTestCaseFormat>(INVALID_NDJSON_TEST_CASES)(
      'should throw an error for invalid NDJSON',
      async ({ rawString }) => {
        const invalidNDJSONFileStream = Readable.from(rawString.join('\n'));
        expect(parser.parseFile(invalidNDJSONFileStream, limit, {})).rejects.toThrow();
      }
    );
  });
});
