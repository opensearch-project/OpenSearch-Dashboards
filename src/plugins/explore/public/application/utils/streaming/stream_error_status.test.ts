/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { streamJobError, streamRequestError } from './stream_error_status';

/**
 * How the Traces charts recognise a query naming a field the index does not have (see
 * `isFieldMissingError` in `components/chart/explore_traces_chart.tsx`). Duplicated rather than
 * imported so a change to either side shows up as a failure here.
 */
const isFieldMissingError = (error: any): boolean =>
  error?.message?.type === 'SemanticCheckException' &&
  error?.message?.details?.includes("can't resolve Symbol");

describe('streamJobError', () => {
  it('reports the type, reason and details the backend attached to the failed job', () => {
    expect(
      streamJobError({
        type: 'SemanticCheckException',
        reason: 'Invalid Query',
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=status.code) in type env",
      })
    ).toEqual({
      statusCode: 500,
      error: 'SemanticCheckException',
      message: {
        type: 'SemanticCheckException',
        reason: 'Invalid Query',
        details: "can't resolve Symbol(namespace=FIELD_NAME, name=status.code) in type env",
      },
      originalErrorMessage: 'Invalid Query',
    });
  });

  // The whole point of preserving the fields: the Traces charts key off them to explain which field
  // is missing instead of showing a generic failure.
  it('produces an error the Traces charts recognise as a missing field', () => {
    const error = streamJobError({
      type: 'SemanticCheckException',
      reason: 'Invalid Query',
      details: "can't resolve Symbol(namespace=FIELD_NAME, name=status.code) in type env",
    });
    expect(isFieldMissingError(error)).toBe(true);
  });

  it('falls back to the reason when the backend sends no details', () => {
    const error = streamJobError({ type: 'IllegalStateException', reason: 'shard failure' });
    expect(error.message.details).toBe('shard failure');
    expect(error.message.reason).toBe('shard failure');
  });

  // A job that reached FAILED is known to have failed, so the fallback says so rather than
  // "Unknown Error", without inventing a type or details.
  it('still says the query failed when the backend reports no cause', () => {
    const error = streamJobError(undefined);
    expect(error.message.reason).toBe('The query failed on the server.');
    expect(error.message.details).toBe('The query failed on the server.');
    expect(error.message.type).toBeUndefined();
  });
});

describe('streamRequestError', () => {
  // A PPL failure arrives as an HTTP error whose body.message is itself JSON, exactly as the
  // non-streaming path receives it.
  it('parses the backend error nested in body.message', () => {
    const error = streamRequestError({
      body: {
        statusCode: 400,
        error: 'Bad Request',
        message: JSON.stringify({
          error: {
            type: 'SemanticCheckException',
            reason: 'Invalid Query',
            details: "can't resolve Symbol(namespace=FIELD_NAME, name=nope) in type env",
          },
        }),
      },
    });

    expect(error.statusCode).toBe(400);
    expect(error.error).toBe('Bad Request');
    expect(error.message.type).toBe('SemanticCheckException');
    expect(error.message.reason).toBe('Invalid Query');
    expect(isFieldMissingError(error)).toBe(true);
  });

  it('uses the plain text when body.message is not JSON', () => {
    const error = streamRequestError({
      body: { statusCode: 503, error: 'Service Unavailable', message: 'all shards failed' },
    });

    expect(error.statusCode).toBe(503);
    expect(error.message.reason).toBe('all shards failed');
    expect(error.message.details).toBe('all shards failed');
    expect(error.originalErrorMessage).toBe('all shards failed');
  });

  it('falls back to the thrown error when there is no response body', () => {
    const error = streamRequestError(new TypeError('Failed to fetch'));

    expect(error.statusCode).toBe(500);
    expect(error.error).toBe('TypeError');
    expect(error.message.reason).toBe('Failed to fetch');
    expect(error.message.type).toBe('TypeError');
  });

  it('stays readable for a non-Error rejection', () => {
    const error = streamRequestError('something odd');
    expect(error.message.reason).toBe('Unknown Error');
    expect(error.originalErrorMessage).toBe('Unknown Error');
  });

  // A disabled feature flag answers 403 with a stable body; the status code has to survive so the
  // client can tell it apart from a transport failure.
  it('preserves a 403 from a disabled feature flag', () => {
    const error = streamRequestError({
      body: { statusCode: 403, error: 'Forbidden', message: 'Feature is not enabled' },
    });

    expect(error.statusCode).toBe(403);
    expect(error.message.reason).toBe('Feature is not enabled');
  });
});
