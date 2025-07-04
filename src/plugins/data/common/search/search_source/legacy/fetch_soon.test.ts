/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { setImmediate } from 'timers';

import { SearchResponse } from 'elasticsearch';
import { UI_SETTINGS } from '../../../constants';
import { GetConfigFn } from '../../../types';
import { FetchHandlers, SearchRequest } from '../fetch';
import { ISearchOptions } from '../../index';
import { callClient } from './call_client';
import { fetchSoon } from './fetch_soon';

function getConfigStub(config: any = {}): GetConfigFn {
  return (key) => config[key];
}

const mockResponses: Record<string, SearchResponse<any>> = {
  foo: {
    took: 1,
    timed_out: false,
  } as SearchResponse<any>,
  bar: {
    took: 2,
    timed_out: false,
  } as SearchResponse<any>,
  baz: {
    took: 3,
    timed_out: false,
  } as SearchResponse<any>,
};

// @ts-expect-error TS2559 TODO(ts-error): fixme
jest.useFakeTimers('legacy');
setImmediate(() => {});

jest.mock('./call_client', () => ({
  callClient: jest.fn((requests: SearchRequest[]) => {
    // Allow a request object to specify which mockResponse it wants to receive (_mockResponseId)
    // in addition to how long to simulate waiting before returning a response (_waitMs)
    const responses = requests.map((request) => {
      const waitMs = requests.reduce((total, { _waitMs }) => total + _waitMs || 0, 0);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockResponses[request._mockResponseId]);
        }, waitMs);
      });
    });
    return Promise.resolve(responses);
  }),
}));

describe('fetchSoon', () => {
  beforeEach(() => {
    (callClient as jest.Mock).mockClear();
  });

  test('should execute asap if config is set to not batch searches', () => {
    const getConfig = getConfigStub({ [UI_SETTINGS.COURIER_BATCH_SEARCHES]: false });
    const request = {};
    const options = {};

    fetchSoon(request, options, { getConfig } as FetchHandlers);

    expect(callClient).toBeCalled();
  });

  test('should delay by 50ms if config is set to batch searches', () => {
    const getConfig = getConfigStub({ [UI_SETTINGS.COURIER_BATCH_SEARCHES]: true });
    const request = {};
    const options = {};

    fetchSoon(request, options, { getConfig } as FetchHandlers);

    expect(callClient).not.toBeCalled();
    jest.advanceTimersByTime(0);
    expect(callClient).not.toBeCalled();
    jest.advanceTimersByTime(50);
    expect(callClient).toBeCalled();
  });

  test('should send a batch of requests to callClient', () => {
    const getConfig = getConfigStub({ [UI_SETTINGS.COURIER_BATCH_SEARCHES]: true });
    const requests = [{ foo: 1 }, { foo: 2 }];
    const options = [{ bar: 1 }, { bar: 2 }];

    requests.forEach((request, i) => {
      fetchSoon(request, options[i] as ISearchOptions, { getConfig } as FetchHandlers);
    });

    jest.advanceTimersByTime(50);
    expect(callClient).toBeCalledTimes(1);
    expect((callClient as jest.Mock).mock.calls[0][0]).toEqual(requests);
    expect((callClient as jest.Mock).mock.calls[0][1]).toEqual(options);
  });

  test('should group search requests by data source and send separate batches of requests to callClient for each data source', () => {
    const getConfig = getConfigStub({ [UI_SETTINGS.COURIER_BATCH_SEARCHES]: true });
    const requests = [
      { foo: 1, dataSourceId: 'ds-1' },
      { foo: 2, dataSourceId: 'ds-2' },
      { foo: 3, dataSourceId: 'ds-1' },
    ];
    const options = [{ bar: 1 }, { bar: 2 }, { bar: 3 }];

    requests.forEach((request, i) => {
      fetchSoon(request, options[i] as ISearchOptions, { getConfig } as FetchHandlers);
    });

    jest.advanceTimersByTime(50);
    expect(callClient).toBeCalledTimes(2);
    expect((callClient as jest.Mock).mock.calls[0]).toEqual(
      expect.arrayContaining([
        [{ foo: 1 }, { foo: 3 }],
        [{ bar: 1 }, { bar: 3 }],
        expect.anything(),
        'ds-1',
      ])
    );
    expect((callClient as jest.Mock).mock.calls[1]).toEqual(
      expect.arrayContaining([[{ foo: 2 }], [{ bar: 2 }], expect.anything(), 'ds-2'])
    );
  });

  test('should return the response to the corresponding call for multiple batched requests', (done) => {
    const getConfig = getConfigStub({ [UI_SETTINGS.COURIER_BATCH_SEARCHES]: true });
    const requests = [{ _mockResponseId: 'foo' }, { _mockResponseId: 'bar' }];

    const promises = requests.map((request) =>
      fetchSoon(request, {}, { getConfig } as FetchHandlers)
    );
    jest.advanceTimersByTime(50);
    Promise.all(promises).then((results) => {
      expect(results).toEqual([mockResponses.foo, mockResponses.bar]);
      done();
    });
  });

  test('should wait for the previous batch to start before starting a new batch', () => {
    const getConfig = getConfigStub({ [UI_SETTINGS.COURIER_BATCH_SEARCHES]: true });
    const firstBatch = [{ foo: 1 }, { foo: 2 }];
    const secondBatch = [{ bar: 1 }, { bar: 2 }];

    firstBatch.forEach((request) => {
      fetchSoon(request, {}, { getConfig } as FetchHandlers);
    });
    jest.advanceTimersByTime(50);
    secondBatch.forEach((request) => {
      fetchSoon(request, {}, { getConfig } as FetchHandlers);
    });

    expect(callClient).toBeCalledTimes(1);
    expect((callClient as jest.Mock).mock.calls[0][0]).toEqual(firstBatch);

    jest.advanceTimersByTime(50);

    expect(callClient).toBeCalledTimes(2);
    expect((callClient as jest.Mock).mock.calls[1][0]).toEqual(secondBatch);
  });
});
