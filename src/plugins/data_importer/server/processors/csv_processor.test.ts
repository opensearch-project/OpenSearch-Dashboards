/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Readable } from 'stream';
import { CSVProcessor } from './csv_processor';
import { CSVTestCaseFormat, INVALID_CSV_CASES, VALID_CSV_CASES } from './test_utils/csv_test_cases';
import { opensearchServiceMock } from '../../../../core/server/mocks';
import { IndexResponse } from '@opensearch-project/opensearch/api/types';

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
        } catch (e) {}
      }
    );
  });

  describe('ingestText()', () => {
    beforeEach(() => {
      clientMock.index.mockClear();
    });

    it.each<CSVTestCaseFormat>(VALID_CSV_CASES)(
      'should index $expected.length documents into OpenSearch',
      async ({ rawStringArray, delimiter, expected }) => {
        const response = await processor.ingestText(rawStringArray.join(''), {
          client: clientMock,
          indexName: 'foo',
          delimiter,
        });

        expect(clientMock.index).toHaveBeenCalledTimes(expected.length);
        expect(response.total).toBe(expected.length);
        expect(response.failedRows.length).toBe(0);
      }
    );

    it.each<CSVTestCaseFormat>(VALID_CSV_CASES)(
      'should handle OpenSearch errors and show the correct failedRow',
      async ({ rawStringArray, delimiter, expected }) => {
        const mockSuccessfulResponse = opensearchServiceMock.createApiResponse<IndexResponse>();
        clientMock.index
          .mockRejectedValueOnce({})
          .mockResolvedValueOnce(mockSuccessfulResponse)
          .mockRejectedValueOnce({})
          .mockResolvedValue(mockSuccessfulResponse);

        const response = await processor.ingestText(rawStringArray.join(''), {
          client: clientMock,
          indexName: 'foo',
          delimiter,
        });

        expect(clientMock.index).toHaveBeenCalledTimes(expected.length);
        expect(response.total).toBe(expected.length);
        if (expected.length > 0) {
          expect(response.failedRows).toContain(1);
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

    it.each<CSVTestCaseFormat>(VALID_CSV_CASES)(
      'should index $expected.length documents into OpenSearch',
      async ({ expected, delimiter, rawStringArray }) => {
        const validCSVFileStream = Readable.from(rawStringArray);
        const response = await processor.ingestFile(validCSVFileStream, {
          client: clientMock,
          indexName: 'foo',
          delimiter,
        });

        expect(clientMock.index).toHaveBeenCalledTimes(expected.length);
        expect(response.total).toBe(expected.length);
      }
    );

    it.each<CSVTestCaseFormat>(VALID_CSV_CASES)(
      'should handle OpenSearch errors and show the correct failedRow',
      async ({ rawStringArray, delimiter, expected }) => {
        const mockSuccessfulResponse = opensearchServiceMock.createApiResponse<IndexResponse>();
        clientMock.index
          .mockRejectedValueOnce({})
          .mockResolvedValueOnce(mockSuccessfulResponse)
          .mockRejectedValueOnce({})
          .mockResolvedValue(mockSuccessfulResponse);

        const validCSVFileStream = Readable.from(rawStringArray);
        const response = await processor.ingestFile(validCSVFileStream, {
          client: clientMock,
          indexName: 'foo',
          delimiter,
        });

        expect(clientMock.index).toHaveBeenCalledTimes(expected.length);
        expect(response.total).toBe(expected.length);
        if (expected.length > 0) {
          expect(response.failedRows).toContain(1);
        }
        if (expected.length > 2) {
          expect(response.failedRows).toContain(3);
        }
      }
    );

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
          expect(clientMock.index.mock.calls.length).toBeLessThanOrEqual(expected.length);
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
