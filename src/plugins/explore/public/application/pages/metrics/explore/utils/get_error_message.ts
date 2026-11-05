/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

/**
 * The text to show for a failed metrics request.
 *
 * A failed HTTP call rejects with the response's status text as its `message` (empty over
 * HTTP/2, so the error reads just "Error") and the server's own error in `body.message`. The
 * server's message says what went wrong, so it comes first; then the error's message; then the
 * error itself as a string.
 */
export const getErrorMessage = (error: unknown): string => {
  const { body, message } = (error ?? {}) as { body?: unknown; message?: unknown };
  const bodyMessage =
    body && typeof body === 'object' ? (body as { message?: unknown }).message : undefined;
  return nonEmptyString(bodyMessage) ?? nonEmptyString(message) ?? String(error);
};
