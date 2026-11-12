/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './types';
export {
  isValidTimeField,
  pickTimeField,
  DEFAULT_TIME_FIELD_CANDIDATES,
  TRACE_TIME_FIELD_CANDIDATES,
} from './time_field_utils';
export {
  OTEL_V1_SPAN_INDEX_PATTERN,
  OTEL_V2_SPAN_INDEX_PATTERN,
  OTEL_SPAN_INDEX_PATTERNS,
  DEFAULT_TRACE_SPAN_INDEX_PATTERN,
  spanPatternMatchesMultipleTemplates,
  isMissingIndicesError,
} from './otel_span_patterns';
export { datasetTypeRequiresExplicitRun } from './requires_explicit_run';
export {
  extractPPLSourceIndex,
  pplSourceDiffersFromDataset,
  PPLSourceTimeFieldChecker,
  getPPLSourceTimeFieldChecker,
} from './ppl_source_utils';
export type {
  PPLSourceCheckDataset,
  PPLSourceFieldsResolver,
  PPLSourceFieldsProvider,
} from './ppl_source_utils';
