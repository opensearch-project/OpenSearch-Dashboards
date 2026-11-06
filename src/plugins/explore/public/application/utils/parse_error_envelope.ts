/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/** The fields of a serialised search error, `{ error: { type, reason, details }, status }`. */
export interface ErrorEnvelope {
  type?: string;
  reason?: string;
  details?: string;
}

const text = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined;

/**
 * Reads `error.{type,reason,details}` from the serialised error a search strategy puts in a failed
 * request's `body.message`.
 *
 * Returns undefined when the text is not a JSON object, so a caller can tell a plain message (shown
 * as it is) from an envelope that lacks a field. Fields that are not non-empty strings are left out.
 */
export const parseErrorEnvelope = (message?: string): ErrorEnvelope | undefined => {
  if (!message) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(message);
  } catch {
    return undefined;
  }
  if (parsed === null || typeof parsed !== 'object') return undefined;
  const error = (parsed as { error?: unknown }).error;
  if (error === null || typeof error !== 'object') return {};
  const { type, reason, details } = error as Record<string, unknown>;
  return { type: text(type), reason: text(reason), details: text(details) };
};
