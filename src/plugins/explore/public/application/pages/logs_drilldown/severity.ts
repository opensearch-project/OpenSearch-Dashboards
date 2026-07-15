/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getColors } from '../../../components/visualizations/theme/default_colors';

/**
 * Canonical OTel-ish severity field precedence. Matches the repo convention in
 * `traces/.../ppl_request_logs.tsx` (`severityText || severity || level`). Field names are the
 * flattened OTel LogRecord fields as stored in OpenSearch (Data Prepper / OTel exporter),
 * i.e. `severityText` / `severityNumber` — NOT dotted `severity.text`.
 *
 * `severityNumber` is listed LAST so a human-readable text field (severityText/severity/level) is
 * always preferred when present; a numeric-only OTel index still gets detected + bucketed via the
 * OTel severityNumber ranges in `normalizeSeverity`.
 */
export const SEVERITY_FIELD_CANDIDATES = [
  'severityText',
  'severity',
  'level',
  'log.level',
  'severityNumber',
];

/**
 * Preferred time-field precedence — Data Prepper OTel mappings + PPL's expected default timestamp
 * fields. When an index has several date fields we pick the first match here (rather than an
 * arbitrary `dateFields[0]`), falling back to the first date field if none match.
 */
export const TIME_FIELD_CANDIDATES = [
  '@timestamp',
  'time',
  'startTime',
  'endTime',
  'timestamp',
  'observedTimestamp',
];

/**
 * Choose the default time field from an index's date-typed field names, preferring the canonical
 * OTel/PPL order above; falls back to the first date field. Returns undefined if there are none.
 */
export const pickTimeField = (dateFields: string[]): string | undefined => {
  if (dateFields.length === 0) return undefined;
  const set = new Set(dateFields);
  return TIME_FIELD_CANDIDATES.find((f) => set.has(f)) ?? dateFields[0];
};

/**
 * Pick the severity field for an index from its available field names, or undefined if none is
 * present (→ plain single-series count histogram, uncolored level tokens).
 */
export const detectSeverityField = (fieldNames: string[]): string | undefined => {
  const set = new Set(fieldNames);
  return SEVERITY_FIELD_CANDIDATES.find((f) => set.has(f));
};

/** Coarse severity buckets we color by. */
export type SeverityBucket = 'error' | 'warn' | 'info' | 'debug' | 'unknown';

/**
 * Normalize an arbitrary severity value (e.g. "INFO", "WARNING", "err", "ERROR", severityNumber
 * as string) into a coarse bucket for coloring. OTel severityNumber ranges: 1-4 trace/debug,
 * 5-8 debug, 9-12 info, 13-16 warn, 17-24 error/fatal.
 */
export const normalizeSeverity = (raw: unknown): SeverityBucket => {
  if (raw == null) return 'unknown';
  const s = String(raw).trim().toLowerCase();
  if (s === '') return 'unknown';

  // Numeric severityNumber form.
  const n = Number(s);
  if (Number.isFinite(n) && /^\d+$/.test(s)) {
    if (n >= 17) return 'error';
    if (n >= 13) return 'warn';
    if (n >= 9) return 'info';
    if (n >= 5) return 'debug';
    return 'unknown';
  }

  if (/(^|[^a-z])(err|error|fatal|crit|critical|alert|emerg|severe)($|[^a-z])/.test(s))
    return 'error';
  if (/(^|[^a-z])(warn|warning)($|[^a-z])/.test(s)) return 'warn';
  if (/(^|[^a-z])(info|information|notice)($|[^a-z])/.test(s)) return 'info';
  if (/(^|[^a-z])(debug|trace|verbose|fine|finest)($|[^a-z])/.test(s)) return 'debug';
  return 'unknown';
};

/**
 * THE single severity → color map for the whole drilldown. Used identically by the histogram bars,
 * the legend, and the log-line level tokens so a severity reads the same everywhere. Sourced from
 * the SAME palette Metrics Explore uses — `getColors()` status colors (theme-aware, WCAG-tuned) —
 * so the two experiences look like one system: error→red, warn→yellow, info→green, debug→blue.
 */
export const severityColor = (bucket: SeverityBucket): string => {
  const c = getColors();
  switch (bucket) {
    case 'error':
      return c.statusRed;
    case 'warn':
      return c.statusYellow;
    case 'info':
      return c.statusGreen;
    case 'debug':
      return c.statusBlue;
    default:
      return c.subText ?? '#8E96A3';
  }
};

/** Color for a raw severity value in one step (normalize + map). */
export const severityColorForValue = (raw: unknown): string =>
  severityColor(normalizeSeverity(raw));
