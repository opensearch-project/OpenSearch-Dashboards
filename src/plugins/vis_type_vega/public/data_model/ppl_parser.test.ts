/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { timefilterServiceMock } from '../../../data/public/query/timefilter/timefilter_service.mock';
import { PPLQueryParser } from './ppl_parser';
import { TimeCache } from './time_cache';

test('it should throw error if with invalid url object', () => {
  const searchApiMock = {
    search: jest.fn(() => ({
      toPromise: jest.fn(() => Promise.resolve({})),
    })),
  };
  const timeCache = new TimeCache(timefilterServiceMock.createStartContract().timefilter, 100);
  // @ts-expect-error TS2345 TODO(ts-error): fixme
  const parser = new PPLQueryParser(timeCache, searchApiMock);
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
  const timeCache = new TimeCache(timefilterServiceMock.createStartContract().timefilter, 100);
  // @ts-expect-error TS2345 TODO(ts-error): fixme
  const parser = new PPLQueryParser(timeCache, searchApiMock);
  const result = parser.parseUrl({}, { body: { query: 'source=test_index' } });
  expect(result.dataObject).toEqual({});
  expect(result.url).toEqual({ body: { query: 'source=test_index' } });
});

test('it should parse url object with %timefield% with injecting time filter to ppl query', () => {
  const from = new Date('2024-10-07T05:03:22.548Z');
  const to = new Date('2025-01-08T05:03:30.981Z');
  jest
    .spyOn(TimeCache.prototype, 'getTimeBounds')
    .mockReturnValue({ max: from.valueOf(), min: to.valueOf() });

  const searchApiMock = {
    search: jest.fn(() => ({
      toPromise: jest.fn(() => Promise.resolve({})),
    })),
  };
  const timeCache = new TimeCache(timefilterServiceMock.createStartContract().timefilter, 100);
  timeCache.setTimeRange({
    from: from.toISOString(),
    to: to.toISOString(),
    mode: 'absolute',
  });

  // @ts-expect-error TS2345 TODO(ts-error): fixme
  const parser = new PPLQueryParser(timeCache, searchApiMock);
  const result1 = parser.parseUrl(
    {},
    { body: { query: 'source=test_index' }, '%timefield%': 'timestamp' }
  );
  expect(result1.url).toEqual({
    body: {
      query:
        "source=test_index | where `timestamp` >= '2025-01-08 05:03:30.981' and `timestamp` <= '2024-10-07 05:03:22.548'",
    },
  });

  const result2 = parser.parseUrl(
    {},
    {
      body: { query: 'source=test_index | stats count() as doc_count' },
      '%timefield%': 'timestamp',
    }
  );
  expect(result2.url).toEqual({
    body: {
      query:
        "source=test_index | where `timestamp` >= '2025-01-08 05:03:30.981' and `timestamp` <= '2024-10-07 05:03:22.548' | stats count() as doc_count",
    },
  });
});

test('it should populate data to request', async () => {
  const searchApiMock = {
    search: jest.fn(() => ({
      toPromise: jest.fn(() =>
        Promise.resolve([{ name: 'request name', rawResponse: { jsonData: [{ id: 'id1' }] } }])
      ),
    })),
  };
  const timeCache = new TimeCache(timefilterServiceMock.createStartContract().timefilter, 100);
  // @ts-expect-error TS2345 TODO(ts-error): fixme
  const parser = new PPLQueryParser(timeCache, searchApiMock);
  const request = {
    url: { body: { query: 'source=test_index' } },
    dataObject: {
      name: 'request name',
    },
  };
  // @ts-expect-error TS2741 TODO(ts-error): fixme
  await parser.populateData([request]);
  // @ts-expect-error TS2339 TODO(ts-error): fixme
  expect(request.dataObject.values).toEqual([{ id: 'id1' }]);
});
