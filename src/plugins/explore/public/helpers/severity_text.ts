/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Log severity text fields (OpenTelemetry `severityText` and its flattened
 * variants). Their values arrive in mixed casing and spellings from different
 * SDKs ("INFO", "Information", "info"), so list tables show one canonical label.
 * Display only: filters, queries and the expanded document keep the raw value.
 */
export const SEVERITY_TEXT_FIELDS = new Set(['severityText', 'severity.text', 'severity_text']);

// Canonical labels for the OpenTelemetry severity names and common synonyms.
const CANONICAL: Record<string, string> = {
  trace: 'Trace',
  debug: 'Debug',
  dbg: 'Debug',
  info: 'Info',
  information: 'Info',
  informational: 'Info',
  notice: 'Info',
  warn: 'Warn',
  warning: 'Warn',
  error: 'Error',
  err: 'Error',
  fatal: 'Fatal',
  critical: 'Fatal',
  crit: 'Fatal',
  emergency: 'Fatal',
  emerg: 'Fatal',
  alert: 'Fatal',
};

/**
 * "INFO" / "Information" / "info" → "Info"; OTel numbered names ("INFO2",
 * "WARN3") map to their base name. Unknown text is title-cased; empty input
 * returns `undefined` (keep the field's own empty rendering).
 */
export const normalizeSeverityText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (!text) return undefined;
  const key = text.toLowerCase().replace(/\d+$/, '');
  if (CANONICAL[key]) return CANONICAL[key];
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
