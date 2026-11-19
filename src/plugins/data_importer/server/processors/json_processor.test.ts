/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import validJson from './test_utils/valid_json.json';
import invalidJson from './test_utils/invalid_json.json';
import { JSONProcessor } from './json_processor';
import { opensearchServiceMock } from '../../../../core/server/mocks';
import { Readable } from 'stream';
import { bulkActions, bulkDocs, mockBulk } from './test_utils/bulk_test_utils';

describe('JSONProcessor', () => {
  const processor = new JSONProcessor();
  const invalidJsonString =
    '{\n  "id": 8083,\n  "name": "9tTCZ",\n  "is_active": false,\n  "date_joined": "2012-07-06",\n  "score": 9.58\n  "preferences": {\n    "color": "red",\n    "likes": ["rUf6W"]\n  },\n  "history": [\n    {\n      "date": "2015-08-01",\n      "action": "login"\n    }\n  ]\n}';
  const clientMock = opensearchServiceMock.createOpenSearchClient();

  describe('validateText()', () => {
    it('should return true for valid JSON', async () => {
      expect(await processor.validateText(JSON.stringify(validJson), {})).toBe(true);
    });

    it('should return false for invalid JSON', async () => {
      expect(await processor.validateText(JSON.stringify(invalidJsonString), {})).toBe(false);
    });

    it('should return false for JSON with empty fields', async () => {
      expect(await processor.validateText(JSON.stringify(invalidJson), {})).toBe(false);
    });
  });

  describe('ingestText()', () => {
    beforeEach(() => {
      clientMock.bulk.mockReset();
      clientMock.index.mockClear();
      mockBulk(clientMock);
    });

    it('should ingest the document into OpenSearch via _bulk', async () => {
      const response = await processor.ingestText(JSON.stringify(validJson), {
        client: clientMock,
        indexName: 'foo',
      });

      expect(response.total).toBe(1);
      expect(response.failedRows).toEqual([]);
      expect(response.errorSummary).toEqual([]);
      expect(clientMock.index).not.toHaveBeenCalled();
      expect(bulkActions(clientMock)).toEqual([{ index: { _index: 'foo' } }]);
      expect(bulkDocs(clientMock)).toEqual([validJson]);
    });

    it('should handle OpenSearch errors and report the cause', async () => {
      mockBulk(clientMock, [1]);

      const response = await processor.ingestText(JSON.stringify(validJson), {
        client: clientMock,
        indexName: 'foo',
      });

      expect(clientMock.bulk).toHaveBeenCalledTimes(1);
      expect(response.total).toBe(1);
      expect(response.failedRows).toEqual([1]);
      expect(response.message).toBe('Indexed 0 documents');
      expect(response.errorSummary).toEqual([
        expect.objectContaining({ type: 'mapper_parsing_exception', count: 1, sampleRows: [1] }),
      ]);
    });

    it('should inject lookup field when lookupId and lookupField are provided', async () => {
      const lookupId = 'test-lookup-id';
      const lookupField = '__lookup';

      await processor.ingestText(JSON.stringify(validJson), {
        client: clientMock,
        indexName: 'foo',
        lookupId,
        lookupField,
      });

      expect(bulkDocs(clientMock)).toEqual([{ ...validJson, [lookupField]: lookupId }]);
    });
  });

  describe('ingestFile()', () => {
    beforeEach(() => {
      clientMock.bulk.mockReset();
      clientMock.index.mockClear();
      mockBulk(clientMock);
    });

    it('should ingest the document into OpenSearch via _bulk', async () => {
      const validJsonFileStream = Readable.from([JSON.stringify(validJson)]);
      const response = await processor.ingestFile(validJsonFileStream, {
        client: clientMock,
        indexName: 'foo',
      });

      expect(response.total).toBe(1);
      expect(response.failedRows).toEqual([]);
      expect(clientMock.index).not.toHaveBeenCalled();
      expect(bulkDocs(clientMock)).toEqual([validJson]);
    });

    it('should populate failedRows and a parse_error summary for invalid JSON', async () => {
      const invalidJsonFileStream = Readable.from([invalidJsonString]);
      const response = await processor.ingestFile(invalidJsonFileStream, {
        client: clientMock,
        indexName: 'foo',
      });
      expect(response.total).toBe(1);
      expect(response.failedRows).toMatchObject([1]);
      expect(response.errorSummary).toEqual([
        expect.objectContaining({ type: 'parse_error', count: 1, sampleRows: [1] }),
      ]);
      expect(clientMock.bulk).not.toHaveBeenCalled();
    });

    it('should populate failedRows and NOT index a document with empty fields', async () => {
      const invalidJsonFileStream = Readable.from([JSON.stringify(invalidJson)]);
      const response = await processor.ingestFile(invalidJsonFileStream, {
        client: clientMock,
        indexName: 'foo',
      });
      expect(response.total).toBe(1);
      expect(response.failedRows).toMatchObject([1]);
      expect(response.errorSummary).toEqual([
        expect.objectContaining({ type: 'invalid_row', count: 1 }),
      ]);
      expect(clientMock.bulk).not.toHaveBeenCalled();
    });

    it('should handle OpenSearch errors and report the cause', async () => {
      mockBulk(clientMock, [1]);

      const validJSONFileStream = Readable.from(JSON.stringify(validJson));
      const response = await processor.ingestFile(validJSONFileStream, {
        client: clientMock,
        indexName: 'foo',
      });

      expect(clientMock.bulk).toHaveBeenCalledTimes(1);
      expect(response.total).toBe(1);
      expect(response.failedRows).toMatchObject([1]);
      expect(response.errorSummary).toEqual([
        expect.objectContaining({ type: 'mapper_parsing_exception', count: 1 }),
      ]);
    });

    it('should stringify numbers going into keyword fields of the target mapping', async () => {
      const response = await processor.ingestFile(
        Readable.from([JSON.stringify({ zip: 2134, age: 30 })]),
        {
          client: clientMock,
          indexName: 'foo',
          mapping: { properties: { zip: { type: 'keyword' }, age: { type: 'integer' } } },
        }
      );

      expect(response.failedRows).toEqual([]);
      expect(bulkDocs(clientMock)).toEqual([{ zip: '2134', age: 30 }]);
    });

    it('should inject lookup field when lookupId and lookupField are provided', async () => {
      const lookupId = 'test-lookup-id';
      const lookupField = '__lookup';
      const validJsonFileStream = Readable.from([JSON.stringify(validJson)]);

      await processor.ingestFile(validJsonFileStream, {
        client: clientMock,
        indexName: 'foo',
        lookupId,
        lookupField,
      });

      expect(bulkDocs(clientMock)).toEqual([{ ...validJson, [lookupField]: lookupId }]);
    });
  });

  describe('parseFile()', () => {
    const limit = 3;
    it('should parse the document', async () => {
      const validJsonFileStream = Readable.from([JSON.stringify(validJson)]);
      const response = await processor.parseFile(validJsonFileStream, limit, {});

      expect(response).toEqual([validJson]);
    });

    it('should throw an error when attempting to parse the document', async () => {
      const invalidJsonFileStream = Readable.from([invalidJsonString]);
      expect(processor.parseFile(invalidJsonFileStream, limit, {})).rejects.toThrow();
    });

    it('should throw an error when attempting to parse the document with empty fields', async () => {
      const invalidJsonFileStream = Readable.from([JSON.stringify(invalidJson)]);
      expect(processor.parseFile(invalidJsonFileStream, limit, {})).rejects.toThrow();
    });
  });
});
