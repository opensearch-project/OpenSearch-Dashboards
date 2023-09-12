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

import {
  HttpFetchError,
  HttpFetchOptionsWithPath,
  HttpResponse,
  HttpSetup,
} from '../../../../../../core/public';
import { OpenSearchRequestArgs, sendRequestToOpenSearch } from './send_request_to_opensearch';
import * as opensearch from '../../../lib/opensearch/opensearch';

const createMockResponse = (
  statusCode: number,
  statusText: string,
  headers: Array<[string, string]>
): Response => {
  return {
    // headers: {} as Headers,
    headers: new Headers(headers),
    ok: true,
    redirected: false,
    status: statusCode,
    statusText,
    type: 'basic',
    url: '',
    clone: jest.fn(),
    body: (jest.fn() as unknown) as ReadableStream,
    bodyUsed: true,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    text: jest.fn(),
    formData: jest.fn(),
    json: jest.fn(),
  };
};

const createMockHttpResponse = (
  statusCode: number,
  statusText: string,
  headers: Array<[string, string]>,
  body: any
): HttpResponse<any> => {
  return {
    fetchOptions: (jest.fn() as unknown) as Readonly<HttpFetchOptionsWithPath>,
    request: (jest.fn() as unknown) as Readonly<Request>,
    response: createMockResponse(statusCode, statusText, headers),
    body,
  };
};
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

  it('test request success, json with long numerals', () => {
    const longPositive = BigInt(Number.MAX_SAFE_INTEGER) * 2n;
    const longNegative = BigInt(Number.MIN_SAFE_INTEGER) * 2n;
    const mockHttpResponse = createMockHttpResponse(
      200,
      'ok',
      [['Content-Type', 'application/json, utf-8']],
      {
        'long-max': longPositive,
        'long-min': longNegative,
      }
    );

    jest.spyOn(opensearch, 'send').mockResolvedValue(mockHttpResponse);
    sendRequestToOpenSearch(dummyArgs).then((result) => {
      const value = (result as any)[0].response.value;
      expect(value).toMatch(new RegExp(`"long-max": ${longPositive}[,\n]`));
      expect(value).toMatch(new RegExp(`"long-min": ${longNegative}[,\n]`));
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
