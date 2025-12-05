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

import { HttpFetchError, HttpSetup } from '../../../../../../core/public';
import { OpenSearchRequestArgs, sendRequestToOpenSearch } from './send_request_to_opensearch';
import * as opensearch from '../../../lib/opensearch/opensearch';
import {
  createMockHttpResponse,
  createMockResponse,
} from '../../../lib/opensearch/http_response.mock';

const dummyArgs: OpenSearchRequestArgs = {
  http: ({
    post: jest.fn(),
  } as unknown) as HttpSetup,
  requests: [
    {
      method: 'GET',
      url: '/dummy/api',
      data: ['{}'],
    },
  ],
};

describe('test sendRequestToOpenSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('test request success, json', () => {
    const mockHttpResponse = createMockHttpResponse(
      200,
      'ok',
      [['Content-Type', 'application/json, utf-8']],
      {
        ok: true,
      }
    );

    jest.spyOn(opensearch, 'send').mockResolvedValue(mockHttpResponse);
    sendRequestToOpenSearch(dummyArgs).then((result) => {
      expect((result as any)[0].response.value).toBe('{\n  "ok": true\n}');
    });
  });

  it('test request success, json with long numerals when precision enabled', () => {
    const longPositive = BigInt(Number.MAX_SAFE_INTEGER) * 2n + 1n;
    const longNegative = BigInt(Number.MIN_SAFE_INTEGER) * 2n + 1n;
    const mockHttpResponse = createMockHttpResponse(
      200,
      'ok',
      [['Content-Type', 'application/json, utf-8']],
      {
        'long-max': longPositive,
        'long-min': longNegative,
      }
    );

    const send = jest.spyOn(opensearch, 'send');
    send.mockResolvedValue(mockHttpResponse);
    sendRequestToOpenSearch({
      ...dummyArgs,
      withLongNumeralsSupport: true,
    }).then((result) => {
      expect(send).toHaveBeenCalledWith(
        expect.anything(),
        dummyArgs.requests[0].method,
        dummyArgs.requests[0].url,
        dummyArgs.requests[0].data.join('\n') + '\n',
        undefined,
        true
      );
      const value = (result as any)[0].response.value;
      expect(value).toMatch(new RegExp(`"long-max": ${longPositive}[,\n]`));
      expect(value).toMatch(new RegExp(`"long-min": ${longNegative}[,\n]`));
    });
  });

  it('test request success, json with long numerals when precision disabled', () => {
    const longPositive = BigInt(Number.MAX_SAFE_INTEGER) * 2n + 1n;
    const longNegative = BigInt(Number.MIN_SAFE_INTEGER) * 2n + 1n;
    const mockHttpResponse = createMockHttpResponse(
      200,
      'ok',
      [['Content-Type', 'application/json, utf-8']],
      {
        'long-max': Number(longPositive),
        'long-min': Number(longNegative),
      }
    );

    const send = jest.spyOn(opensearch, 'send');
    send.mockResolvedValue(mockHttpResponse);
    sendRequestToOpenSearch({
      ...dummyArgs,
      withLongNumeralsSupport: false,
    }).then((result) => {
      expect(send).toHaveBeenCalledWith(
        expect.anything(),
        dummyArgs.requests[0].method,
        dummyArgs.requests[0].url,
        dummyArgs.requests[0].data.join('\n') + '\n',
        undefined,
        false
      );
      const value = (result as any)[0].response.value;
      expect(value).toMatch(new RegExp(`"long-max": ${Number(longPositive)}[,\n]`));
      expect(value).toMatch(new RegExp(`"long-min": ${Number(longNegative)}[,\n]`));
    });
  });

  it('test request success, text', () => {
    const mockHttpResponse = createMockHttpResponse(
      200,
      'ok',
      [['Content-Type', 'text/plain']],
      'response text'
    );

    jest.spyOn(opensearch, 'send').mockResolvedValue(mockHttpResponse);
    sendRequestToOpenSearch(dummyArgs).then((result) => {
      expect((result as any)[0].response.value).toBe('response text');
    });
  });

  it('test request success, with warning', () => {
    const mockHttpResponse = createMockHttpResponse(
      200,
      'ok',
      [
        ['Content-Type', 'text/plain'],
        ['warning', 'dummy warning'],
      ],
      'response text'
    );

    jest.spyOn(opensearch, 'send').mockResolvedValue(mockHttpResponse);
    sendRequestToOpenSearch(dummyArgs).then((result) => {
      expect((result as any)[0].response.value).toBe(
        '#! Deprecation: dummy warning\nresponse text'
      );
    });
  });

  it('test request 404', () => {
    const mockHttpResponse = createMockHttpResponse(
      404,
      'not found',
      [['Content-Type', 'text/plain']],
      'response text'
    );

    jest.spyOn(opensearch, 'send').mockResolvedValue(mockHttpResponse);
    sendRequestToOpenSearch(dummyArgs).then((result) => {
      expect((result as any)[0].response.value).toBe('response text');
    });
  });

  it('test request 500, json', () => {
    const mockHttpError: HttpFetchError = new HttpFetchError(
      'error message',
      'name',
      (jest.fn as unknown) as Request,
      createMockResponse(500, 'Server Error', [['Content-Type', 'application/json, utf-8']]),
      { errorMsg: 'message' }
    );

    jest.spyOn(opensearch, 'send').mockRejectedValue(mockHttpError);
    sendRequestToOpenSearch(dummyArgs).catch((error) => {
      expect(error.response.value).toBe('{\n  "errorMsg": "message"\n}');
    });
  });

  it('test request 500, text', () => {
    const mockHttpError: HttpFetchError = new HttpFetchError(
      'error message',
      'name',
      (jest.fn as unknown) as Request,
      createMockResponse(500, 'Server Error', [['Content-Type', 'text/plain']]),
      'error message'
    );

    jest.spyOn(opensearch, 'send').mockRejectedValue(mockHttpError);
    sendRequestToOpenSearch(dummyArgs).catch((error) => {
      expect(error.response.value).toBe('error message');
    });
  });

  it('test no connection', () => {
    const mockHttpError: HttpFetchError = new HttpFetchError(
      'error message',
      'name',
      (jest.fn as unknown) as Request,
      undefined,
      'error message'
    );

    jest.spyOn(opensearch, 'send').mockRejectedValue(mockHttpError);
    sendRequestToOpenSearch(dummyArgs).catch((error) => {
      expect(error.response.value).toBe(
        "\n\nFailed to connect to Console's backend.\nPlease check the OpenSearch Dashboards server is up and running"
      );
    });
  });
});
