/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataViewMissingIndices } from '../data_views/lib/errors';
import { IndexPatternMissingIndices } from '../index_patterns/lib/errors';
import {
  DEFAULT_TRACE_SPAN_INDEX_PATTERN,
  isMissingIndicesError,
  OTEL_SPAN_INDEX_PATTERNS,
  spanPatternMatchesMultipleTemplates,
} from './otel_span_patterns';

describe('otel span patterns', () => {
  it('probes v2 before v1', () => {
    expect(OTEL_SPAN_INDEX_PATTERNS).toEqual(['otel-v2-apm-span*', 'otel-v1-apm-span*']);
  });

  it.each([
    [DEFAULT_TRACE_SPAN_INDEX_PATTERN, true],
    ['otel-v*-apm-span*', true],
    ['otel-*', true],
    ['*', true],
    ['otel-v1-apm-span*, otel-v2-apm-span*', true],
    ['otel-v1-apm-span*', false],
    ['otel-v2-apm-span*', false],
    ['otel-v1-apm-span-000001', false],
    ['otel-v1-apm-span*,-otel-v2-apm-span*', false],
    ['jaeger-span-*', false],
    ['', false],
    [undefined, false],
  ])('spanPatternMatchesMultipleTemplates(%p) is %p', (pattern, expected) => {
    expect(spanPatternMatchesMultipleTemplates(pattern)).toBe(expected);
  });

  it('treats regex characters in a pattern literally', () => {
    expect(spanPatternMatchesMultipleTemplates('otel-v.-apm-span-*')).toBe(false);
  });

  it('recognises only missing-indices errors', () => {
    expect(isMissingIndicesError(new IndexPatternMissingIndices('x'))).toBe(true);
    expect(isMissingIndicesError(new DataViewMissingIndices('x'))).toBe(true);
    expect(isMissingIndicesError(new Error('No matching indices'))).toBe(false);
    expect(isMissingIndicesError(undefined)).toBe(false);
  });
});
