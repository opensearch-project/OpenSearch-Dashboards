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

  // PromQL's search strategy throws its error serialised: `{ error: { type, reason, details }, status }`.
  const promqlEnvelope = (error: Record<string, unknown>) =>
    JSON.stringify({ error: { type: 'PromQLQueryError', ...error }, status: 403 });

  it('reads a serialised search error: its details, else its reason, never its type or the JSON', () => {
    const details = "You don't have permission to read these metrics.";
    const withDetails = httpError('Forbidden', {
      message: promqlEnvelope({ reason: 'PromQL query failed', details }),
    });
    expect(getErrorMessage(withDetails)).toBe(details);
    expect(toMetricsLoadError(withDetails)).toEqual({ message: details, fromServer: true });
    expect(
      getErrorMessage(
        httpError('Bad Request', { message: promqlEnvelope({ reason: 'bad query' }) })
      )
    ).toBe('bad query');
    // Behind the resources route's prefix too.
    expect(
      getErrorMessage(
        httpError('x', { message: `Unable to get resources: ${promqlEnvelope({ details: 'd' })}` })
      )
    ).toBe('d');
    for (const message of [
      promqlEnvelope({ reason: 'r', details: 'd' }),
      promqlEnvelope({ reason: 'r' }),
    ]) {
      const shown = getErrorMessage(httpError('Forbidden', { message }));
      expect(shown).not.toMatch(/PromQLQueryError|[{}]/);
    }
  });

  it('shows the status text for a serialised error with nothing readable (no raw JSON)', () => {
    // A serialised client SDK error (as a data source can return it), and envelopes without text.
    const sdkError = JSON.stringify({
      name: 'AccessDenied',
      $fault: 'client',
      $metadata: { httpStatusCode: 403, requestId: 'r-1' },
      message: 'not authorized',
    });
    for (const message of [
      sdkError,
      promqlEnvelope({}),
      promqlEnvelope({ reason: '  ', details: 7 }),
      JSON.stringify({ error: 'x' }),
      '{}',
    ]) {
      const error = httpError('Forbidden', { message });
      expect(getErrorMessage(error)).toBe('Forbidden');
      expect(toMetricsLoadError(error)).toEqual({ message: 'Forbidden', fromServer: false });
    }
  });

  it('keeps a message that is not a JSON object as it is', () => {
    for (const message of ['[1,2]', '"quoted"', '42', 'null', '{not json']) {
      expect(getErrorMessage(httpError('x', { message }))).toBe(message);
    }
  });

  it('falls back to the error as a string', () => {
    expect(getErrorMessage(httpError(''))).toBe('Error');
    expect(getErrorMessage('stringly')).toBe('stringly');
    expect(getErrorMessage(undefined)).toBe('undefined');
    expect(getErrorMessage(null)).toBe('null');
    expect(getErrorMessage({ toString: () => 'custom' })).toBe('custom');
  });
});
