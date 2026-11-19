/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseErrorEnvelope } from './parse_error_envelope';

describe('parseErrorEnvelope', () => {
  it('reads the type, reason and details of a serialised error', () => {
    const message = JSON.stringify({
      error: { type: 'FakeQueryException', reason: 'Fake query failed', details: 'Fake details.' },
      status: 400,
    });
    expect(parseErrorEnvelope(message)).toEqual({
      type: 'FakeQueryException',
      reason: 'Fake query failed',
      details: 'Fake details.',
    });
  });

  it('returns undefined for text that is not a JSON object', () => {
    expect(parseErrorEnvelope(undefined)).toBeUndefined();
    expect(parseErrorEnvelope('')).toBeUndefined();
    expect(parseErrorEnvelope('Fake source is not reachable')).toBeUndefined();
    expect(parseErrorEnvelope('{"error":{"reason":"cut')).toBeUndefined();
    expect(parseErrorEnvelope('"quoted"')).toBeUndefined();
    expect(parseErrorEnvelope('null')).toBeUndefined();
  });

  it('returns no fields for a JSON object without an error object', () => {
    expect(parseErrorEnvelope('{"status":400}')).toEqual({});
    expect(parseErrorEnvelope('{"error":"Fake"}')).toEqual({});
    expect(parseErrorEnvelope('{"error":null}')).toEqual({});
  });

  it('leaves out fields that are not non-empty strings', () => {
    const message = JSON.stringify({ error: { type: 7, reason: '', details: { nested: true } } });
    expect(parseErrorEnvelope(message)).toEqual({
      type: undefined,
      reason: undefined,
      details: undefined,
    });
  });
});
