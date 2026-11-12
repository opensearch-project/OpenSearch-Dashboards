/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { streamJobError } from './stream_error_status';

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
