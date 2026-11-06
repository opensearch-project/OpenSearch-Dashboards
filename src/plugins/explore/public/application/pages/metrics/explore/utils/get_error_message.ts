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
 * The readable text of a message that is a serialised error object, or the message itself.
 *
 * A search strategy can put a whole serialised error in `body.message`, e.g. PromQL's
 * `{ error: { type, reason, details }, status }`, or a serialised client SDK error. Shown as it is,
 * that is raw JSON with the internal error type. So for a JSON object: its `error.details`, else
 * `error.reason`; with neither, no server text at all (the caller falls back to the status text).
 * Any other message is returned unchanged.
 */
const readableServerText = (message: string): string | undefined => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(message);
  } catch {
    return message;
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return message;
  const envelope = (parsed as { error?: unknown }).error;
  if (envelope === null || typeof envelope !== 'object') return undefined;
  const { details, reason } = envelope as { details?: unknown; reason?: unknown };
  return nonEmptyString(details) ?? nonEmptyString(reason);
};

/**
 * The server's own message for a failed request (the response body's `message`), without the
 * resources route's prefix and read out of a serialised error, or undefined when the server sent
 * none.
 */
export const getServerErrorMessage = (error: unknown): string | undefined => {
  const { body } = (error ?? {}) as { body?: unknown };
  const bodyMessage =
    body && typeof body === 'object' ? (body as { message?: unknown }).message : undefined;
  const message = nonEmptyString(
    typeof bodyMessage === 'string' ? bodyMessage.replace(RESOURCES_ROUTE_PREFIX, '') : undefined
  );
  return message === undefined ? undefined : nonEmptyString(readableServerText(message));
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

/**
 * Whether a server message is only a name for the failure, not an explanation: the HTTP status
 * phrase (the body's `error`, or the status text), a client's generic error name, or an object
 * stringified by mistake. Such a message is still shown, with the generic advice kept.
 */
const isBareFailureName = (text: string, error: unknown): boolean => {
  const { body, message } = (error ?? {}) as { body?: unknown; message?: unknown };
  const statusPhrase =
    body && typeof body === 'object' ? (body as { error?: unknown }).error : undefined;
  const normalized = text.trim().toLowerCase();
  return (
    /^\[object \w+\]$/.test(normalized) ||
    normalized === 'response error' ||
    [statusPhrase, message].some(
      (name) => typeof name === 'string' && name.trim().toLowerCase() === normalized
    )
  );
};

/**
 * A failure as the error callout shows it: its text, and whether the server explained it (then
 * the callout leads with the source instead of the generic "Check your connection" advice).
 */
export interface MetricsLoadError {
  message: string;
  fromServer: boolean;
}

export const toMetricsLoadError = (error: unknown): MetricsLoadError => {
  const server = getServerErrorMessage(error);
  return {
    message: getErrorMessage(error),
    fromServer: server !== undefined && !isBareFailureName(server, error),
  };
};
