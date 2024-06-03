import { ResponseError } from '@opensearch-project/opensearch/lib/errors';
import { ERROR_DETAILS } from '../../../common/query_assist';

export class ProhibitedQueryError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

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
    return error.body as Error;
  }
  return error;
};
