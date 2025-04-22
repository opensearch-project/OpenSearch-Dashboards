/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import validJson from './test_utils/valid_json.json';
import invalidJson from './test_utils/invalid_json.json';
import { JSONProcessor } from './json_processor';
import { opensearchServiceMock } from '../../../../core/server/mocks';
import { Readable } from 'stream';

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
      clientMock.index.mockClear();
    });

    it('should ingest the document into OpenSearch', async () => {
      const response = await processor.ingestText(JSON.stringify(validJson), {
        client: clientMock,
        indexName: 'foo',
      });

      expect(response.total).toBe(1);
      expect(clientMock.index).toHaveBeenCalledWith({
        index: 'foo',
        body: validJson,
      });
    });

    it('should handle OpenSearch errors and show the correct failedRow', async () => {
      clientMock.index.mockRejectedValueOnce({});

      const response = await processor.ingestText(JSON.stringify(validJson), {
        client: clientMock,
        indexName: 'foo',
      });

      expect(clientMock.index).toHaveBeenCalledTimes(1);
      expect(response.total).toBe(1);
      expect(response.failedRows).toMatchObject([1]);
    });
  });

  describe('ingestFile()', () => {
    beforeEach(() => {
      clientMock.index.mockClear();
    });

    it('should ingest the document into OpenSearch', async () => {
      const validJsonFileStream = Readable.from([JSON.stringify(validJson)]);
      const response = await processor.ingestFile(validJsonFileStream, {
        client: clientMock,
        indexName: 'foo',
      });

      expect(response.total).toBe(1);
      expect(clientMock.index).toHaveBeenCalledWith({
        index: 'foo',
        body: validJson,
      });
    });

    it('should populate failedRows when attempting to ingest an invalid document into OpenSearch', async () => {
      const invalidJsonFileStream = Readable.from([invalidJsonString]);
      const response = await processor.ingestFile(invalidJsonFileStream, {
        client: clientMock,
        indexName: 'foo',
      });
      expect(response.total).toBe(1);
      expect(response.failedRows).toMatchObject([1]);
    });

    it('should populate failedRows when attempting to ingest the document with empty fields into OpenSearch', async () => {
      const invalidJsonFileStream = Readable.from([JSON.stringify(invalidJson)]);
      const response = await processor.ingestFile(invalidJsonFileStream, {
        client: clientMock,
        indexName: 'foo',
      });
      expect(response.total).toBe(1);
      expect(response.failedRows).toMatchObject([1]);
    });

    it('should handle OpenSearch errors and show the correct failedRow', async () => {
      clientMock.index.mockRejectedValueOnce({});

      const validJSONFileStream = Readable.from(JSON.stringify(validJson));
      const response = await processor.ingestFile(validJSONFileStream, {
        client: clientMock,
        indexName: 'foo',
      });

      expect(clientMock.index).toHaveBeenCalledTimes(1);
      expect(response.total).toBe(1);
      expect(response.failedRows).toMatchObject([1]);
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
