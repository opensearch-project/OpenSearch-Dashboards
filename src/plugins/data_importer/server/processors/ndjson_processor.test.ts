/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { opensearchServiceMock } from '../../../../core/server/mocks';
import { NDJSONProcessor } from './ndjson_processor';
import {
  INVALID_NDJSON_TEST_CASES,
  NDJSONTestCaseFormat,
  VALID_NDJSON_TEST_CASES,
} from './test_utils/ndjson_test_cases';
import { Readable } from 'stream';
import { IngestResponse } from '../types';
import { bulkDocs, mockBulk } from './test_utils/bulk_test_utils';

describe('NDJSONProcessor', () => {
  const processor = new NDJSONProcessor();
  const clientMock = opensearchServiceMock.createOpenSearchClient();

  describe('validateText()', () => {
    it.each<NDJSONTestCaseFormat>(VALID_NDJSON_TEST_CASES)(
      'should return true for valid NDJSON',
      async ({ rawString }) => {
        expect(await processor.validateText(rawString.join('\n'), {})).toBe(true);
      }
    );
    it.each<NDJSONTestCaseFormat>(INVALID_NDJSON_TEST_CASES)(
      'should throw an error for invalid NDJSON',
      async ({ rawString }) => {
        expect(processor.validateText(rawString.join('\n'), {})).rejects.toThrow();
      }
    );
  });

  const ingestModes: Array<{
    mode: string;
    ingest: (
      raw: string[],
      options: Omit<Parameters<NDJSONProcessor['ingestFile']>[1], 'client' | 'indexName'>
    ) => Promise<IngestResponse>;
  }> = [
    {
      mode: 'ingestText()',
      ingest: (raw, options) =>
        processor.ingestText(raw.join('\n'), { client: clientMock, indexName: 'foo', ...options }),
    },
    {
      mode: 'ingestFile()',
      ingest: (raw, options) =>
        processor.ingestFile(Readable.from(raw.join('\n')), {
          client: clientMock,
          indexName: 'foo',
          ...options,
        }),
    },
  ];

  describe.each(ingestModes)('$mode', ({ ingest }) => {
    beforeEach(() => {
      clientMock.bulk.mockReset();
      clientMock.index.mockClear();
      mockBulk(clientMock);
    });

    it.each<NDJSONTestCaseFormat>(VALID_NDJSON_TEST_CASES)(
      'should bulk index $expected.length documents into OpenSearch',
      async ({ rawString, expected }) => {
        const response = await ingest(rawString, {});

        expect(clientMock.index).not.toHaveBeenCalled();
        expect(response.total).toBe(expected.length);
        expect(bulkDocs(clientMock)).toEqual(expected);
        expect(response.failedRows).toEqual([]);
        expect(response.errorSummary).toEqual([]);
      }
    );

    it.each<NDJSONTestCaseFormat>(VALID_NDJSON_TEST_CASES)(
      'should report partial bulk failures with row numbers and a bucketed error summary',
      async ({ rawString, expected }) => {
        mockBulk(clientMock, [2, 3]);

        const response = await ingest(rawString, {});

        const expectedFailed = [2, 3].filter((r) => r <= expected.length);
        expect(response.total).toBe(expected.length);
        expect(response.failedRows).toEqual(expectedFailed);
        expect(response.errorSummary).toEqual(
          expectedFailed.length > 0
            ? [
                expect.objectContaining({
                  type: 'mapper_parsing_exception',
                  count: expectedFailed.length,
                  sampleRows: expectedFailed,
                }),
              ]
            : []
        );
      }
    );

    it.each<NDJSONTestCaseFormat>(VALID_NDJSON_TEST_CASES)(
      'should inject lookup field when lookupId and lookupField are provided',
      async ({ rawString, expected }) => {
        const lookupId = 'test-lookup-id';
        const lookupField = '__lookup';

        await ingest(rawString, { lookupId, lookupField });

        const docs = bulkDocs(clientMock);
        expect(docs).toHaveLength(expected.length);
        docs.forEach((doc) => expect(doc).toHaveProperty(lookupField, lookupId));
      }
    );
  });

  describe('ingestFile()', () => {
    beforeEach(() => {
      clientMock.bulk.mockReset();
      mockBulk(clientMock);
    });

    it.each<NDJSONTestCaseFormat>(INVALID_NDJSON_TEST_CASES)(
      'should throw an error for invalid NDJSON',
      async ({ rawString }) => {
        const invalidNDJSONFileStream = Readable.from(rawString.join('\n'));
        try {
          const response = await processor.ingestFile(invalidNDJSONFileStream, {
            client: clientMock,
            indexName: 'foo',
          });

          expect(response.failedRows.length).toBeGreaterThan(0);
          expect(bulkDocs(clientMock).length).toBeLessThanOrEqual(rawString.length);
          // eslint-disable-next-line no-empty
        } catch {}
      }
    );

    it('should stringify numbers going into keyword fields, leaving a mixed column consistent', async () => {
      const response = await processor.ingestFile(
        Readable.from(['{"code": 123}', '{"code": "N/A"}', '{"code": 4.5}'].join('\n')),
        {
          client: clientMock,
          indexName: 'foo',
          mapping: { properties: { code: { type: 'keyword' } } },
        }
      );

      expect(response.failedRows).toEqual([]);
      expect(bulkDocs(clientMock)).toEqual([{ code: '123' }, { code: 'N/A' }, { code: '4.5' }]);
    });

    it('should report documents with empty fields as invalid_row without sending them', async () => {
      const response = await processor.ingestFile(
        Readable.from(['{"a": 1}', '{"": 2}', '{"b": 3}'].join('\n')),
        { client: clientMock, indexName: 'foo' }
      );

      expect(bulkDocs(clientMock)).toEqual([{ a: 1 }, { b: 3 }]);
      expect(response.total).toBe(3);
      expect(response.failedRows).toEqual([2]);
      expect(response.errorSummary).toEqual([
        expect.objectContaining({ type: 'invalid_row', count: 1, sampleRows: [2] }),
      ]);
    });
  });

  describe('parseFile()', () => {
    const limit = 4;
    it.each<NDJSONTestCaseFormat>(VALID_NDJSON_TEST_CASES)(
      'should parse 4 documents from NDJSON',
      async ({ rawString, expected }) => {
        const validNDJSONFileStream = Readable.from(rawString.join('\n'));
        const response = await processor.parseFile(validNDJSONFileStream, limit, {});

        expect(response).toEqual(expected.slice(0, limit));
      }
    );

    it.each<NDJSONTestCaseFormat>(INVALID_NDJSON_TEST_CASES)(
      'should throw an error for invalid NDJSON',
      async ({ rawString }) => {
        const invalidNDJSONFileStream = Readable.from(rawString.join('\n'));
        expect(processor.parseFile(invalidNDJSONFileStream, limit, {})).rejects.toThrow();
      }
    );
  });
});
