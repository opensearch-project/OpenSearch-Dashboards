/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { opensearchClientMock } from '../../../../core/server/opensearch/client/mocks';
import { NDJSONParser } from './ndjson_parser';
import {
  INVALID_NDJSON_TEST_CASES,
  NDJSONTestCaseFormat,
  VALID_NDJSON_TEST_CASES,
} from './test_utils/ndjson_test_cases';
import { Readable } from 'stream';

describe('NDJSONParser', () => {
  const parser = new NDJSONParser();
  const clientMock = opensearchClientMock.createOpenSearchClient();

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

    it.each<NDJSONTestCaseFormat>(INVALID_NDJSON_TEST_CASES)(
      'should throw an error for invalid NDJSON',
      async ({ rawString, expected }) => {
        const invalidNDJSONFileStream = Readable.from(rawString.join('\n'));
        expect(
          parser.ingestFile(invalidNDJSONFileStream, {
            client: clientMock,
            indexName: 'foo',
          })
        ).rejects.toThrow();

        expect(clientMock.index.mock.calls.length <= expected.length).toBe(true);
      }
    );
  });
});
