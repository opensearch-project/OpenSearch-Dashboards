/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DiagnosticRange, LintResult } from '../../diagnostic';
import { ExplainOperation } from '../explain_types';

export const EXPLAIN_ATTRIBUTION_SNAPSHOT_VERSION = 1 as const;

export type ExplainProbeKind = 'filter-term' | 'aggregate-term' | 'sort-key';

export interface ExplainAttributionCandidateSnapshot {
  id: string;
  scopeId: 'outer';
  operation: ExplainOperation;
  probeKind: ExplainProbeKind;
  startOffset: number;
  endOffset: number;
  stageStartOffset: number;
  stageEndOffset: number;
  separatorStartOffset?: number;
  stageRange: DiagnosticRange;
  focusRange: DiagnosticRange;
  relatedRange?: DiagnosticRange;
  sourceText: string;
  aliasBinding?: {
    alias: string;
    definitionRange: DiagnosticRange;
    definitionStartOffset: number;
    definitionEndOffset: number;
    baseFieldSource?: string;
  };
  filterComparison?: {
    startOffset: number;
    endOffset: number;
    range: DiagnosticRange;
  };
}

export interface ExplainAttributionSnapshot {
  protocolVersion: typeof EXPLAIN_ATTRIBUTION_SNAPSHOT_VERSION;
  queryLength: number;
  candidates: ExplainAttributionCandidateSnapshot[];
  unsupportedOperations: ExplainOperation[];
}

export interface CompiledPPLLintAnalysis {
  result: LintResult;
  attribution?: ExplainAttributionSnapshot;
}

const OPERATIONS = new Set<ExplainOperation>(['filter', 'aggregation', 'sort']);
const PROBE_KINDS = new Set<ExplainProbeKind>(['filter-term', 'aggregate-term', 'sort-key']);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isOffset(value: unknown, queryLength: number): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= queryLength;
}

function isSpan(
  value: Record<string, unknown>,
  startKey: string,
  endKey: string,
  queryLength: number
): boolean {
  return (
    isOffset(value[startKey], queryLength) &&
    isOffset(value[endKey], queryLength) &&
    (value[startKey] as number) <= (value[endKey] as number)
  );
}

function isRange(value: unknown): value is DiagnosticRange {
  if (!isPlainRecord(value)) {
    return false;
  }
  const { startLine, startColumn, endLine, endColumn } = value;
  return (
    Number.isInteger(startLine) &&
    (startLine as number) >= 1 &&
    Number.isInteger(startColumn) &&
    (startColumn as number) >= 0 &&
    Number.isInteger(endLine) &&
    (endLine as number) >= (startLine as number) &&
    Number.isInteger(endColumn) &&
    (endColumn as number) >= 0 &&
    ((endLine as number) > (startLine as number) ||
      (endColumn as number) >= (startColumn as number))
  );
}

function isAliasBinding(value: unknown, queryLength: number): boolean {
  if (!isPlainRecord(value) || typeof value.alias !== 'string' || !value.alias) {
    return false;
  }
  return (
    isRange(value.definitionRange) &&
    isSpan(value, 'definitionStartOffset', 'definitionEndOffset', queryLength) &&
    (value.baseFieldSource === undefined || typeof value.baseFieldSource === 'string')
  );
}

function isFilterComparison(
  value: unknown,
  queryLength: number,
  candidateStart: number,
  candidateEnd: number
): boolean {
  if (!isPlainRecord(value) || !isRange(value.range)) {
    return false;
  }
  return (
    isSpan(value, 'startOffset', 'endOffset', queryLength) &&
    (value.startOffset as number) >= candidateStart &&
    (value.endOffset as number) <= candidateEnd
  );
}

function isCandidate(
  value: unknown,
  query: string,
  ids: Set<string>
): value is ExplainAttributionCandidateSnapshot {
  if (!isPlainRecord(value)) {
    return false;
  }
  const operation = value.operation as ExplainOperation;
  const probeKind = value.probeKind as ExplainProbeKind;
  if (
    typeof value.id !== 'string' ||
    !value.id ||
    ids.has(value.id) ||
    value.scopeId !== 'outer' ||
    !OPERATIONS.has(operation) ||
    !PROBE_KINDS.has(probeKind) ||
    !isSpan(value, 'startOffset', 'endOffset', query.length) ||
    !isSpan(value, 'stageStartOffset', 'stageEndOffset', query.length) ||
    !isRange(value.stageRange) ||
    !isRange(value.focusRange) ||
    (value.relatedRange !== undefined && !isRange(value.relatedRange)) ||
    typeof value.sourceText !== 'string'
  ) {
    return false;
  }

  const startOffset = value.startOffset as number;
  const endOffset = value.endOffset as number;
  const stageStartOffset = value.stageStartOffset as number;
  const stageEndOffset = value.stageEndOffset as number;
  if (
    startOffset < stageStartOffset ||
    endOffset > stageEndOffset ||
    query.slice(startOffset, endOffset) !== value.sourceText ||
    (value.separatorStartOffset !== undefined &&
      (!isOffset(value.separatorStartOffset, query.length) ||
        value.separatorStartOffset > stageStartOffset)) ||
    (value.aliasBinding !== undefined && !isAliasBinding(value.aliasBinding, query.length)) ||
    (value.filterComparison !== undefined &&
      !isFilterComparison(value.filterComparison, query.length, startOffset, endOffset))
  ) {
    return false;
  }

  ids.add(value.id);
  return true;
}

/**
 * Validate a worker-supplied attribution snapshot before it influences network
 * requests or editor ranges. Invalid or newer protocol payloads fail closed.
 */
export function validateExplainAttributionSnapshot(
  value: unknown,
  query: string
): ExplainAttributionSnapshot | undefined {
  if (
    !isPlainRecord(value) ||
    value.protocolVersion !== EXPLAIN_ATTRIBUTION_SNAPSHOT_VERSION ||
    value.queryLength !== query.length ||
    !Array.isArray(value.candidates) ||
    !Array.isArray(value.unsupportedOperations)
  ) {
    return undefined;
  }

  const ids = new Set<string>();
  if (!value.candidates.every((candidate) => isCandidate(candidate, query, ids))) {
    return undefined;
  }

  const unsupported = value.unsupportedOperations as unknown[];
  if (
    unsupported.some((operation) => !OPERATIONS.has(operation as ExplainOperation)) ||
    new Set(unsupported).size !== unsupported.length
  ) {
    return undefined;
  }

  return value as unknown as ExplainAttributionSnapshot;
}
