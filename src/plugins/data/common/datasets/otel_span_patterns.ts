/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataViewMissingIndices } from '../data_views/lib/errors';
import { IndexPatternMissingIndices } from '../index_patterns/lib/errors';

/**
 * OpenTelemetry span index conventions written by Data Prepper. Shared by every plugin that
 * detects or queries span data (Explore traces, Agent Traces, Observability APM) so they agree
 * on one list.
 */

/** Data Prepper `trace-analytics-plain-raw-v2` span index pattern. */
export const OTEL_V2_SPAN_INDEX_PATTERN = 'otel-v2-apm-span*';
/** Data Prepper `trace-analytics-plain-raw` (v1) span index pattern. */
export const OTEL_V1_SPAN_INDEX_PATTERN = 'otel-v1-apm-span*';
/**
 * Span index patterns in detection priority order. v2 comes first so that, when a traces
 * dataset is created for the first time and both exist, only v2 is used. Data sources that
 * already have a traces dataset are not changed.
 */
export const OTEL_SPAN_INDEX_PATTERNS = [
  OTEL_V2_SPAN_INDEX_PATTERN,
  OTEL_V1_SPAN_INDEX_PATTERN,
] as const;

/**
 * Span index pattern used when a trace page has no dataset to read from. Matches both the v1
 * and v2 span indices, so v2-only clusters still resolve.
 */
export const DEFAULT_TRACE_SPAN_INDEX_PATTERN = 'otel-v*-apm-span-*';

// Representative concrete index names for each span template.
const V1_SPAN_INDEX_SAMPLE = 'otel-v1-apm-span-000001';
const V2_SPAN_INDEX_SAMPLE = 'otel-v2-apm-span-000001';

const wildcardToRegExp = (pattern: string): RegExp =>
  new RegExp(
    `^${pattern
      .trim()
      .split('*')
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')}$`
  );

/**
 * Whether an index pattern (possibly comma-separated) matches both the v1 and v2 span indices,
 * so the same span can be returned twice when Data Prepper writes to both. Exclusions (`-foo`)
 * are ignored, which can only over-report.
 */
export const spanPatternMatchesMultipleTemplates = (pattern: string | undefined): boolean => {
  if (!pattern) return false;
  const regexps = pattern
    .split(',')
    .filter((part) => part.trim() && !part.trim().startsWith('-'))
    .map(wildcardToRegExp);
  return (
    regexps.some((re) => re.test(V1_SPAN_INDEX_SAMPLE)) &&
    regexps.some((re) => re.test(V2_SPAN_INDEX_SAMPLE))
  );
};

/**
 * Whether an error from `getFieldsForWildcard` means the pattern matched no indices, as
 * opposed to a timeout, permission or server error.
 */
export const isMissingIndicesError = (error: unknown): boolean =>
  error instanceof IndexPatternMissingIndices || error instanceof DataViewMissingIndices;
