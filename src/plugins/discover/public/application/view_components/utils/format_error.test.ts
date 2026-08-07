/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractQueryError } from './format_error';

describe('extractQueryError', () => {
  it('prefers shortMessage above everything else', () => {
    const errorBody = {
      shortMessage: 'Short and sweet',
      message: { error: { reason: 'ignored reason' } },
      attributes: { error: { reason: 'also ignored' } },
    };
    expect(extractQueryError(errorBody)).toBe('Short and sweet');
  });

  it('returns attributes.error when it is a string', () => {
    expect(extractQueryError({ attributes: { error: 'attribute level error' } })).toBe(
      'attribute level error'
    );
  });

  it('prefers attributes.error over message.error', () => {
    const errorBody = {
      attributes: { error: { reason: 'from attributes' } },
      message: { error: { reason: 'from message' } },
    };
    expect(extractQueryError(errorBody)).toBe('from attributes');
  });

  it('extracts the first root_cause reason from a structured error', () => {
    const errorBody = {
      message: {
        error: {
          root_cause: [{ reason: 'root cause reason' }, { reason: 'second cause' }],
          reason: 'top level reason',
        },
      },
    };
    expect(extractQueryError(errorBody)).toBe('root cause reason');
  });

  it('falls back to details when there is no root_cause', () => {
    const errorBody = { message: { error: { details: 'the details', reason: 'the reason' } } };
    expect(extractQueryError(errorBody)).toBe('the details');
  });

  it('falls back to reason when there is no root_cause or details', () => {
    const errorBody = { message: { error: { reason: 'just the reason' } } };
    expect(extractQueryError(errorBody)).toBe('just the reason');
  });

  it('returns the message when it is a plain string', () => {
    expect(extractQueryError({ message: 'plain string message' })).toBe('plain string message');
  });

  it('falls back to the top-level error string', () => {
    expect(extractQueryError({ error: 'Bad Request' })).toBe('Bad Request');
  });

  it('returns the default message when nothing usable is present', () => {
    expect(extractQueryError({})).toBe('Query execution failed');
    expect(extractQueryError(undefined)).toBe('Query execution failed');
    expect(extractQueryError(null)).toBe('Query execution failed');
  });

  it('returns the default message when a structured inner error has no usable fields', () => {
    expect(extractQueryError({ message: { error: { type: 'SomeException' } } })).toBe(
      'Query execution failed'
    );
  });
});
