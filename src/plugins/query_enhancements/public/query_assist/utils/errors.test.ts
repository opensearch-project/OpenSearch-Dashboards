/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseError } from '@opensearch-project/opensearch/lib/errors';
import { ERROR_DETAILS } from '../../../common';
import { AgentError, formatError, ProhibitedQueryError } from './errors';

describe('formatError', () => {
  it('should return an error with a custom message for status code 429', () => {
    const error = new ResponseError({
      statusCode: 429,
      body: {
        statusCode: 429,
        message: 'Too many requests',
      },
      warnings: [],
      headers: null,
      meta: {} as any,
    });

    const formattedError = formatError(error);
    expect(formattedError.message).toEqual(
      'Request is throttled. Try again later or contact your administrator'
    );
  });

  it('should return a ProhibitedQueryError for guardrails triggered', () => {
    const error = new ResponseError({
      statusCode: 400,
      body: {
        statusCode: 400,
        message: ERROR_DETAILS.GUARDRAILS_TRIGGERED,
      },
      warnings: [],
      headers: null,
      meta: {} as any,
    });
    const formattedError = formatError(error);
    expect(formattedError).toBeInstanceOf(ProhibitedQueryError);
    expect(formattedError.message).toEqual(error.body.message);
  });

  it('should return an AgentError if possible', () => {
    const error = new ResponseError({
      statusCode: 400,
      body: {
        statusCode: 400,
        message: `{"error":{"reason":"Invalid Request","details":"PPLTool doesn't support searching indexes starting with '.' since it could be system index, current searching index name: .opensearch-sap-log-types-config","type":"IllegalArgumentException"},"status":400}`,
      },
      warnings: [],
      headers: null,
      meta: {} as any,
    });
    const formattedError = formatError(error);
    expect(formattedError).toBeInstanceOf(AgentError);
    expect((formattedError as AgentError).error.error.details).toEqual(
      "PPLTool doesn't support searching indexes starting with '.' since it could be system index, current searching index name: .opensearch-sap-log-types-config"
    );
  });

  it('should return the original error body for other errors', () => {
    const error = new ResponseError({
      statusCode: 500,
      body: {
        statusCode: 500,
        message: 'Internal server error',
      },
      warnings: [],
      headers: null,
      meta: {} as any,
    });
    const formattedError = formatError(error);
    expect(formattedError).toEqual(error.body);
  });

  it('should return the original error if no body property', () => {
    const error = new Error('Some error');
    const formattedError = formatError(error);
    expect(formattedError).toEqual(error);
  });
});
