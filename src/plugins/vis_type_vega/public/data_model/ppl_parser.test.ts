/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PPLQueryParser } from './ppl_parser';

test('it should throw error if with invalid url object', () => {
  const searchApiMock = {
    search: jest.fn(() => ({
      toPromise: jest.fn(() => Promise.resolve({})),
    })),
  };
  const parser = new PPLQueryParser(searchApiMock);
  expect(() => parser.parseUrl({}, {})).toThrowError();
  expect(() => parser.parseUrl({}, { body: {} })).toThrowError();
  expect(() => parser.parseUrl({}, { body: { query: {} } })).toThrowError();
});

test('it should parse url object', () => {
  const searchApiMock = {
    search: jest.fn(() => ({
      toPromise: jest.fn(() => Promise.resolve({})),
    })),
  };
  const parser = new PPLQueryParser(searchApiMock);
  const result = parser.parseUrl({}, { body: { query: 'source=test_index' } });
  expect(result.dataObject).toEqual({});
  expect(result.url).toEqual({ body: { query: 'source=test_index' } });
});

it('should populate data to request', async () => {
  const searchApiMock = {
    search: jest.fn(() => ({
      toPromise: jest.fn(() =>
        Promise.resolve([{ name: 'request name', rawResponse: { jsonData: [{ id: 'id1' }] } }])
      ),
    })),
  };
  const parser = new PPLQueryParser(searchApiMock);
  const request = {
    url: { body: { query: 'source=test_index' } },
    dataObject: {
      name: 'request name',
    },
  };
  await parser.populateData([request]);
  expect(request.dataObject.values).toEqual([{ id: 'id1' }]);
});
