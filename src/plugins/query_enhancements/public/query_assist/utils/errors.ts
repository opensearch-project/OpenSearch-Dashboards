/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// eslint-disable-next-line max-classes-per-file
import { ResponseError } from '@opensearch-project/opensearch/lib/errors';
import { ERROR_DETAILS } from '../../../common';

export class ProhibitedQueryError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

interface IAgentError {
  error: {
    reason: string;
    details: string;
    type: string;
  };
  status: number;
}

export class AgentError extends Error {
  public readonly error: IAgentError;
  constructor(error: IAgentError) {
    super(error.error.details);
    if (!(
      'status' in error &&
      'reason' in error.error &&
      'details' in error.error &&
      'type' in error.error
    )) {
      throw new Error('Failed to parse error');
    }
    this.error = error;
  }
}

const parseEmbeddedJson = (value: unknown): any | undefined => {
  if (typeof value !== 'string') return undefined;
  const jsonStart = value.indexOf('{');
  if (jsonStart === -1) return undefined;
  try {
    return JSON.parse(value.slice(jsonStart));
  } catch {
    return undefined;
  }
};

/**
 * The agent error `details` is often a wrapper string like
 * `Error from remote service: {"OriginalMessage":"{...\"error\":\"<real cause>\"...}", ...}`.
 */
export const extractAgentErrorDetail = (details: string): string => {
  if (!details) return details;
  const outer = parseEmbeddedJson(details);
  if (!outer) return details;
  for (const candidate of [outer.OriginalMessage, outer.Message]) {
    const inner = parseEmbeddedJson(candidate);
    if (typeof inner?.error === 'string') return inner.error;
    if (typeof inner?.message === 'string') return inner.message;
  }
  return details;
};

export const formatError = (error: ResponseError | Error): Error => {
  if ('body' in error) {
    if (error.body.statusCode === 429)
      return {
        ...error.body,
        message: 'Request is throttled. Try again later or contact your administrator',
      } as Error;
    if (
      error.body.statusCode === 400 &&
      error.body.message.includes(ERROR_DETAILS.GUARDRAILS_TRIGGERED)
    )
      return new ProhibitedQueryError(error.body.message);
    try {
      return new AgentError(JSON.parse(error.body.message));
    } catch (parseError) {
      return error.body as Error;
    }
  }
  return error;
};
