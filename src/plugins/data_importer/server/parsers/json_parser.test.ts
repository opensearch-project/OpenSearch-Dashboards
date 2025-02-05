/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import validJson from './test_utils/valid_json.json';
import { JSONParser } from './json_parser';
import { opensearchServiceMock } from '../../../../core/server/mocks';
import { Readable } from 'stream';

describe('JSONParser', () => {
  const parser = new JSONParser();
  const invalidJsonString =
    '{\n  "id": 8083,\n  "name": "9tTCZ",\n  "is_active": false,\n  "date_joined": "2012-07-06",\n  "score": 9.58\n  "preferences": {\n    "color": "red",\n    "likes": ["rUf6W"]\n  },\n  "history": [\n    {\n      "date": "2015-08-01",\n      "action": "login"\n    }\n  ]\n}';
  const clientMock = opensearchServiceMock.createOpenSearchClient();

  describe('validateText()', () => {
    it('should return true for valid JSON', async () => {
      expect(await parser.validateText(JSON.stringify(validJson), {})).toBe(true);
    });

    it('should throw error for invalid JSON', async () => {
      expect(await parser.validateText(JSON.stringify(invalidJsonString), {})).toBe(false);
    });
  });
  describe('ingestText()', () => {
    beforeEach(() => {
      clientMock.index.mockClear();
    });

    it('should ingest the document into OpenSearch', async () => {
      const response = await parser.ingestText(JSON.stringify(validJson), {
        client: clientMock,
        indexName: 'foo',
      });

      expect(response.total).toBe(1);
      expect(clientMock.index).toHaveBeenCalledWith({
        index: 'foo',
        body: validJson,
      });
    });
  });

  describe('ingestFile()', () => {
    beforeEach(() => {
      clientMock.index.mockClear();
    });
    it('should ingest the document into OpenSearch', async () => {
      const validJsonFileStream = Readable.from([JSON.stringify(validJson)]);
      const response = await parser.ingestFile(validJsonFileStream, {
        client: clientMock,
        indexName: 'foo',
      });

      expect(response.total).toBe(1);
      expect(clientMock.index).toHaveBeenCalledWith({
        index: 'foo',
        body: validJson,
      });
    });

    it('should throw an error when attempting to ingest the document into OpenSearch', async () => {
      const invalidJsonFileStream = Readable.from([invalidJsonString]);
      expect(
        parser.ingestFile(invalidJsonFileStream, {
          client: clientMock,
          indexName: 'foo',
        })
      ).rejects.toThrow();
    });
  });

  describe('parseFile()', () => {
    const limit = 3;
    it('should parse the document', async () => {
      const validJsonFileStream = Readable.from([JSON.stringify(validJson)]);
      const response = await parser.parseFile(validJsonFileStream, limit, {});

      expect(response).toEqual([validJson]);
    });

    it('should throw an error when attempting to parse the document', async () => {
      const invalidJsonFileStream = Readable.from([invalidJsonString]);
      expect(parser.parseFile(invalidJsonFileStream, limit, {})).rejects.toThrow();
    });
  });
});
