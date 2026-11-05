/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getErrorMessage, getServerErrorMessage, toMetricsLoadError } from './get_error_message';

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
    // Without the resources route's own prefix: the provider's message says what went wrong.
    expect(getErrorMessage(error)).toBe('the credentials in use cannot read these metrics');
  });

  it('strips only a leading "Unable to get resources: ", once', () => {
    expect(getErrorMessage(httpError('x', { message: 'Unable to get resources: a: b' }))).toBe(
      'a: b'
    );
    expect(
      getErrorMessage(
        httpError('x', { message: 'Unable to get resources: Unable to get resources: twice' })
      )
    ).toBe('Unable to get resources: twice');
    expect(getErrorMessage(httpError('x', { message: 'not Unable to get resources: x' }))).toBe(
      'not Unable to get resources: x'
    );
    // Nothing left after the prefix: not a server message.
    expect(
      getErrorMessage(httpError('Bad Gateway', { message: 'Unable to get resources: ' }))
    ).toBe('Bad Gateway');
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

  it("says whether the text is the server's (toMetricsLoadError, getServerErrorMessage)", () => {
    expect(
      toMetricsLoadError(httpError('Forbidden', { message: 'Unable to get resources: no' }))
    ).toEqual({ message: 'no', fromServer: true });
    expect(toMetricsLoadError(httpError('Bad Gateway'))).toEqual({
      message: 'Bad Gateway',
      fromServer: false,
    });
    expect(getServerErrorMessage(new Error('boom'))).toBeUndefined();
    expect(getServerErrorMessage(undefined)).toBeUndefined();
  });

  it('falls back to the error as a string', () => {
    expect(getErrorMessage(httpError(''))).toBe('Error');
    expect(getErrorMessage('stringly')).toBe('stringly');
    expect(getErrorMessage(undefined)).toBe('undefined');
    expect(getErrorMessage(null)).toBe('null');
    expect(getErrorMessage({ toString: () => 'custom' })).toBe('custom');
  });
});
