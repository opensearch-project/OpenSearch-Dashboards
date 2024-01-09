/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpFetchOptionsWithPath, HttpResponse } from '../../../../../core/public';

export const createMockResponse = (
  statusCode: number,
  statusText: string,
  headers: Array<[string, string]>
): Response => {
  return {
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

export const createMockHttpResponse = (
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
