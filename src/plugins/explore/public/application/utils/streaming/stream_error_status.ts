/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import type { PPLStreamError } from '../../../../../query_enhancements/common';
import { QueryResultStatus } from '../state_management/types';

type QueryError = NonNullable<QueryResultStatus['error']>;

const UNKNOWN_ERROR = i18n.translate('explore.streaming.error.unknown', {
  defaultMessage: 'Unknown Error',
});

const DEFAULT_STATUS_CODE = 500;

/**
 * The backend reports a failed job's cause under `error` on the snapshot, and an HTTP failure under
 * `body` on the rejection. Both are mapped onto the shape the non-streaming path produces, because
 * consumers read specific fields from it: the Traces charts, for example, recognise a missing field
 * by `message.type === 'SemanticCheckException'` and a `message.details` containing
 * "can't resolve Symbol". Collapsing every failure into one generic message hides that.
 */

/** The structured cause the backend attaches to a FAILED snapshot. */
export const streamJobError = (error: PPLStreamError | undefined): QueryError => {
  // A job that reached FAILED without a cause is still known to have failed, so say that rather
  // than "Unknown Error". Consumers key off `type` and `details`, neither of which this invents.
  const reason =
    error?.reason ||
    i18n.translate('explore.streaming.error.jobFailed', {
      defaultMessage: 'The query failed on the server.',
    });
  return {
    statusCode: DEFAULT_STATUS_CODE,
    error: error?.type || reason,
    message: {
      details: error?.details || reason,
      reason,
      type: error?.type,
    },
    originalErrorMessage: reason,
  };
};

interface HttpErrorBody {
  statusCode?: number;
  error?: string;
  message?: string;
}

/**
 * A rejected request from the stream routes.
 *
 * `body.message` is the backend's serialised error, which for a PPL failure is itself JSON holding
 * `error.{type,reason,details}`. It is parsed so those fields survive, mirroring the non-streaming
 * path; when it is not JSON the plain text is used as the reason.
 */
export const streamRequestError = (error: unknown): QueryError => {
  const body = (error as { body?: HttpErrorBody })?.body;
  const fallbackMessage =
    body?.message || (error instanceof Error ? error.message : undefined) || UNKNOWN_ERROR;

  let parsed: { error?: { type?: string; reason?: string; details?: string } } | undefined;
  if (body?.message) {
    try {
      parsed = JSON.parse(body.message);
    } catch {
      parsed = undefined;
    }
  }

  const reason = parsed?.error?.reason || fallbackMessage;
  return {
    statusCode: body?.statusCode ?? DEFAULT_STATUS_CODE,
    error: body?.error || (error as { name?: string })?.name || UNKNOWN_ERROR,
    message: {
      details: parsed?.error?.details || reason,
      reason,
      type: parsed?.error?.type ?? (error as { name?: string })?.name,
    },
    originalErrorMessage: fallbackMessage,
  };
};
