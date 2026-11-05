/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value : undefined;

/**
 * The prefix the query enhancements resources route puts before a resource provider's own error
 * message ("Unable to get resources: <message>"). The message says what went wrong; the prefix
 * only stacks a second "failed" on it.
 */
const RESOURCES_ROUTE_PREFIX = /^Unable to get resources: /;

/**
 * The server's own message for a failed request (the response body's `message`), without the
 * resources route's prefix, or undefined when the server sent none.
 */
export const getServerErrorMessage = (error: unknown): string | undefined => {
  const { body } = (error ?? {}) as { body?: unknown };
  const bodyMessage =
    body && typeof body === 'object' ? (body as { message?: unknown }).message : undefined;
  return nonEmptyString(
    typeof bodyMessage === 'string' ? bodyMessage.replace(RESOURCES_ROUTE_PREFIX, '') : undefined
  );
};

/**
 * The text to show for a failed metrics request.
 *
 * A failed HTTP call rejects with the response's status text as its `message` (empty over
 * HTTP/2, so the error reads just "Error") and the server's own error in `body.message`. The
 * server's message says what went wrong, so it comes first (getServerErrorMessage); then the
 * error's message; then the error itself as a string.
 */
export const getErrorMessage = (error: unknown): string => {
  const { message } = (error ?? {}) as { message?: unknown };
  return getServerErrorMessage(error) ?? nonEmptyString(message) ?? String(error);
};

/** A failure as the error callout shows it: its text, and whether the server wrote it. */
export interface MetricsLoadError {
  message: string;
  fromServer: boolean;
}

export const toMetricsLoadError = (error: unknown): MetricsLoadError => ({
  message: getErrorMessage(error),
  fromServer: getServerErrorMessage(error) !== undefined,
});
