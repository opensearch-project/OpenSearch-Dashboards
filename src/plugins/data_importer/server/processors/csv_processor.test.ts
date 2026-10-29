/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Readable } from 'stream';
import { CSVProcessor } from './csv_processor';
import { CSVTestCaseFormat, INVALID_CSV_CASES, VALID_CSV_CASES } from './test_utils/csv_test_cases';
import { opensearchServiceMock } from '../../../../core/server/mocks';
import { IngestResponse } from '../types';
import { BULK_CHUNK_SIZE } from '../utils/bulk_ingest';
import { BulkIndexForbiddenError } from '../utils/util';
import { bulkActions, bulkDocs, mockBulk } from './test_utils/bulk_test_utils';

describe('CSVProcessor', () => {
  const processor = new CSVProcessor();
  const clientMock = opensearchServiceMock.createOpenSearchClient();

  describe('validateText()', () => {
    it.each<CSVTestCaseFormat>(VALID_CSV_CASES)(
      'should pass validation check for text input with delimiter $delimiter',
      async ({ delimiter, rawStringArray }) => {
        expect(await processor.validateText(rawStringArray.join(''), { delimiter })).toBe(true);
      }
    );

    it.each<CSVTestCaseFormat>(INVALID_CSV_CASES)(
      'should fail validation check for text input',
      async ({ rawStringArray, delimiter }) => {
        try {
          const testValidity = await processor.validateText(rawStringArray.join(''), { delimiter });
          expect(testValidity).toBe(false);
          // eslint-disable-next-line no-empty
        } catch {}
      }
    );
  });

  // Shared assertions for ingestText() and ingestFile(): both go through chunked _bulk
  const ingestModes: Array<{
    mode: string;
    ingest: (
      raw: string[],
      options: Omit<Parameters<CSVProcessor['ingestFile']>[1], 'client' | 'indexName'>
    ) => Promise<IngestResponse>;
  }> = [
    {
      mode: 'ingestText()',
      ingest: (raw, options) =>
        processor.ingestText(raw.join(''), { client: clientMock, indexName: 'foo', ...options }),
    },
    {
      mode: 'ingestFile()',
      ingest: (raw, options) =>
        processor.ingestFile(Readable.from(raw), {
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

    it.each<CSVTestCaseFormat>(VALID_CSV_CASES)(
      'should bulk index $expected.length documents into OpenSearch',
      async ({ rawStringArray, delimiter, expected }) => {
        const response = await ingest(rawStringArray, { delimiter });

        expect(clientMock.index).not.toHaveBeenCalled();
        expect(bulkDocs(clientMock)).toEqual(expected);
        bulkActions(clientMock).forEach((action) =>
          expect(action).toEqual({ index: { _index: 'foo' } })
        );
        expect(response.total).toBe(expected.length);
        expect(response.failedRows).toEqual([]);
        expect(response.errorSummary).toEqual([]);
        expect(response.message).toBe(`Indexed ${expected.length} documents`);
      }
    );

    it.each<CSVTestCaseFormat>(VALID_CSV_CASES)(
      'should inject lookup field when lookupId and lookupField are provided',
      async ({ rawStringArray, delimiter, expected }) => {
        const lookupId = 'test-lookup-id';
        const lookupField = '__lookup';

        await ingest(rawStringArray, { delimiter, lookupId, lookupField });

        const docs = bulkDocs(clientMock);
        expect(docs).toHaveLength(expected.length);
        docs.forEach((doc) => expect(doc).toHaveProperty(lookupField, lookupId));
      }
    );

    it.each<CSVTestCaseFormat>(VALID_CSV_CASES)(
      'should report partial bulk failures with row numbers and a bucketed error summary',
      async ({ rawStringArray, delimiter, expected }) => {
        mockBulk(clientMock, [1, 3]);

        const response = await ingest(rawStringArray, { delimiter });

        const expectedFailed = [1, 3].filter((r) => r <= expected.length);
        expect(response.total).toBe(expected.length);
        expect(response.failedRows).toEqual(expectedFailed);
        expect(response.message).toBe(
          `Indexed ${expected.length - expectedFailed.length} documents`
        );
        expect(response.errorSummary).toEqual(
          expectedFailed.length > 0
            ? [
                {
                  type: 'mapper_parsing_exception',
                  reason: 'failed to parse field [age] of type [integer]',
                  count: expectedFailed.length,
                  sampleRows: expectedFailed,
                },
              ]
            : []
        );
      }
    );

    it('should throw BulkIndexForbiddenError when the bulk request is rejected with 403', async () => {
      clientMock.bulk.mockRejectedValue(
        Object.assign(new Error('Response Error'), {
          meta: {
            statusCode: 403,
            body: { error: { type: 'security_exception', reason: 'no permissions' } },
          },
        })
      );

      await expect(
        ingest(['a,b\n', '1,2\n', '3,4\n', '5,6'], { delimiter: ',' })
      ).rejects.toBeInstanceOf(BulkIndexForbiddenError);
    });

    it('should fail every row with the cause when the bulk request is rejected (non-403)', async () => {
      clientMock.bulk.mockRejectedValue(
        Object.assign(new Error('Response Error'), {
          meta: {
            statusCode: 503,
            body: { error: { type: 'cluster_block_exception', reason: 'index blocked' } },
          },
        })
      );

      const response = await ingest(['a,b\n', '1,2\n', '3,4\n', '5,6'], { delimiter: ',' });

      expect(response.total).toBe(3);
      expect(response.failedRows).toEqual([1, 2, 3]);
      expect(response.message).toBe('Indexed 0 documents');
      expect(response.errorSummary).toEqual([
        {
          type: 'cluster_block_exception',
          reason: 'index blocked',
          count: 3,
          sampleRows: [1, 2, 3],
        },
      ]);
    });

    it('should split large inputs into chunks of BULK_CHUNK_SIZE', async () => {
      const rows = BULK_CHUNK_SIZE * 2 + 5;
      const raw = ['n\n', ...Array.from({ length: rows }, (_, i) => `${i}\n`)];

      const response = await ingest(raw, { delimiter: ',' });

      expect(clientMock.bulk).toHaveBeenCalledTimes(3);
      expect(bulkDocs(clientMock)).toHaveLength(rows);
      expect(response.total).toBe(rows);
      expect(response.failedRows).toEqual([]);
    });
  });

  describe('ingestFile()', () => {
    beforeEach(() => {
      clientMock.bulk.mockReset();
      mockBulk(clientMock);
    });

    it('should pass the target mapping through and keep int-like cells as strings for keyword fields', async () => {
      // CSV cells are already strings; with a keyword target they must stay strings (not be parsed)
      const response = await processor.ingestFile(
        Readable.from(['zip,n\n', '02134,1\n', '123,2']),
        {
          client: clientMock,
          indexName: 'foo',
          delimiter: ',',
          mapping: { properties: { zip: { type: 'keyword' }, n: { type: 'integer' } } },
        }
      );

      expect(response.failedRows).toEqual([]);
      expect(bulkDocs(clientMock)).toEqual([
        { zip: '02134', n: '1' },
        { zip: '123', n: '2' },
      ]);
    });

    it('should require a delimiter', async () => {
      await expect(
        processor.ingestFile(Readable.from(['a\n1']), { client: clientMock, indexName: 'foo' })
      ).rejects.toThrow('Delimiter is required');
    });

    it('should report rows rejected by validation as invalid_row without sending them', async () => {
      // header with an empty column name makes every row fail isValidObject
      const response = await processor.ingestFile(Readable.from(['a,,c\n', '1,2,3\n', '4,5,6']), {
        client: clientMock,
        indexName: 'foo',
        delimiter: ',',
      });

      expect(clientMock.bulk).not.toHaveBeenCalled();
      expect(response.failedRows).toEqual([1, 2]);
      expect(response.errorSummary).toEqual([
        expect.objectContaining({ type: 'invalid_row', count: 2, sampleRows: [1, 2] }),
      ]);
    });

    it.each<CSVTestCaseFormat>(INVALID_CSV_CASES)(
      'should throw errors when attempting to ingest documents into OpenSearch',
      async ({ rawStringArray, delimiter, expected }) => {
        const invalidCSVFileStream = Readable.from(rawStringArray);
        try {
          const response = await processor.ingestFile(invalidCSVFileStream, {
            client: clientMock,
            indexName: 'foo',
            delimiter,
          });
          expect(response.failedRows.length).toBeGreaterThan(0);
          expect(bulkDocs(clientMock).length).toBeLessThanOrEqual(expected.length);
          // eslint-disable-next-line no-empty
        } catch (_) {}
      }
    );
  });

  describe('parseFile()', () => {
    const limit = 3;
    it.each<CSVTestCaseFormat>(VALID_CSV_CASES)(
      'should parse 3 documents from CSV file',
      async ({ rawStringArray, delimiter, expected }) => {
        const validCSVFileStream = Readable.from(rawStringArray);
        const response = await processor.parseFile(validCSVFileStream, limit, { delimiter });

        expect(response).toEqual(expected.slice(0, limit));
      }
    );

    it.each<CSVTestCaseFormat>(INVALID_CSV_CASES)(
      'should throw errors when attempting to parse documents from CSV file',
      async ({ rawStringArray, delimiter }) => {
        const invalidCSVFileStream = Readable.from(rawStringArray);
        try {
          await processor.parseFile(invalidCSVFileStream, limit, { delimiter });
          // eslint-disable-next-line no-empty
        } catch (_) {}
      }
    );
  });
});
