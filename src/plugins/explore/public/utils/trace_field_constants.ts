/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const TRACE_ID_FIELD_PATHS = [
  'traceId',
  'trace_id',
  'traceID',
  '_source.traceId',
  '_source.trace_id',
  '_source.traceID',
  'fields.traceId',
  'fields.trace_id',
  'fields.traceID',
] as const;

export const SPAN_ID_FIELD_PATHS = [
  'spanId',
  'span_id',
  'spanID',
  '_source.spanId',
  '_source.span_id',
  '_source.spanID',
  'fields.spanId',
  'fields.span_id',
  'fields.spanID',
] as const;
