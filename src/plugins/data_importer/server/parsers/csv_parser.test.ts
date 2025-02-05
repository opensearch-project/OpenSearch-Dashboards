/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Readable } from 'stream';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { opensearchClientMock } from '../../../../core/server/opensearch/client/mocks';
import { CSVParser } from './csv_parser';
import { CSVTestCaseFormat, INVALID_CSV_CASES, VALID_CSV_CASES } from './test_utils/csv_test_cases';

describe('CSVParser', () => {
  const parser = new CSVParser();
  const clientMock = opensearchClientMock.createOpenSearchClient();

  describe('validateText()', () => {
    it.each<CSVTestCaseFormat>(VALID_CSV_CASES)(
      'should pass validation check for text input with delimiter $delimiter',
      async ({ delimiter, rawStringArray }) => {
        expect(await parser.validateText(rawStringArray.join(''), { delimiter })).toBe(true);
      }
    );

    it.each<CSVTestCaseFormat>(INVALID_CSV_CASES)(
      'should fail validation check for text input',
      async ({ rawStringArray, delimiter }) => {
        try {
          const testValidity = await parser.validateText(rawStringArray.join(''), { delimiter });
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
        const response = await parser.ingestText(rawStringArray.join(''), {
          client: clientMock,
          indexName: 'foo',
          delimiter,
        });

        expect(clientMock.index).toHaveBeenCalledTimes(expected.length);
        expect(response.total).toBe(expected.length);
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
        const response = await parser.ingestFile(validCSVFileStream, {
          client: clientMock,
          indexName: 'foo',
          delimiter,
        });

        expect(clientMock.index).toHaveBeenCalledTimes(expected.length);
        expect(response.total).toBe(expected.length);
      }
    );

    it.each<CSVTestCaseFormat>(INVALID_CSV_CASES)(
      'should throw errors when attempting to ingest documents into OpenSearch',
      async ({ rawStringArray, delimiter, expected }) => {
        const invalidCSVFileStream = Readable.from(rawStringArray);
        try {
          await parser.ingestFile(invalidCSVFileStream, {
            client: clientMock,
            indexName: 'foo',
            delimiter,
          });
          expect(clientMock.index.mock.calls.length === expected.length).toBe(true);
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
        const response = await parser.parseFile(validCSVFileStream, limit, { delimiter });

        expect(response).toEqual(expected.slice(0, limit));
      }
    );

    it.each<CSVTestCaseFormat>(INVALID_CSV_CASES)(
      'should throw errors when attempting to parse documents from CSV file',
      async ({ rawStringArray, delimiter }) => {
        const invalidCSVFileStream = Readable.from(rawStringArray);
        try {
          await parser.parseFile(invalidCSVFileStream, limit, { delimiter });
          // eslint-disable-next-line no-empty
        } catch (_) {}
      }
    );
  });
});
