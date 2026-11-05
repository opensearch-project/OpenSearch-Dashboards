/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getErrorMessage } from './get_error_message';

// What a failed HTTP call rejects with: the status text as the message, the server's error as the body.
const httpError = (statusText: string, body?: unknown) =>
  Object.assign(new Error(statusText), { body });

describe('getErrorMessage', () => {
  it("prefers the server's message in the response body", () => {
    const error = httpError('Forbidden', {
      statusCode: 403,
      error: 'Forbidden',
      message: 'Unable to get resources: the credentials in use cannot read these metrics',
    });
    expect(getErrorMessage(error)).toBe(
      'Unable to get resources: the credentials in use cannot read these metrics'
    );
  });

  it("uses the body's message when the status text is empty (HTTP/2)", () => {
    const error = httpError('', { statusCode: 403, message: 'access denied' });
    expect(String(error)).toBe('Error');
    expect(getErrorMessage(error)).toBe('access denied');
  });

  it("falls back to the error's message without a usable body message", () => {
    expect(getErrorMessage(httpError('Bad Gateway'))).toBe('Bad Gateway');
    expect(getErrorMessage(httpError('Bad Gateway', '<html>proxy error</html>'))).toBe(
      'Bad Gateway'
    );
    expect(getErrorMessage(httpError('Bad Gateway', { message: '   ' }))).toBe('Bad Gateway');
    expect(getErrorMessage(httpError('Bad Gateway', { message: 42 }))).toBe('Bad Gateway');
    expect(getErrorMessage(httpError('Bad Gateway', null))).toBe('Bad Gateway');
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('falls back to the error as a string', () => {
    expect(getErrorMessage(httpError(''))).toBe('Error');
    expect(getErrorMessage('stringly')).toBe('stringly');
    expect(getErrorMessage(undefined)).toBe('undefined');
    expect(getErrorMessage(null)).toBe('null');
    expect(getErrorMessage({ toString: () => 'custom' })).toBe('custom');
  });
});
