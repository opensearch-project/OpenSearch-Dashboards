/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../monaco';
import { Diagnostic, DiagnosticHoverFacts, DiagnosticRange, LintSeverity } from './diagnostic';

interface MonacoRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

function toMonacoRange(range: DiagnosticRange): MonacoRange {
  const startLineNumber = Math.max(1, range.startLine);
  const endLineNumber = Math.max(startLineNumber, range.endLine);
  const startColumn = Math.max(1, range.startColumn + 1);
  let endColumn = Math.max(1, range.endColumn + 1);
  if (endLineNumber === startLineNumber) {
    endColumn = Math.max(startColumn, endColumn);
  }
  return { startLineNumber, startColumn, endLineNumber, endColumn };
}

export const LINT_MARKER_SOURCE = 'ppl-lint';

function toMarkerSeverity(severity: LintSeverity): monaco.MarkerSeverity {
  switch (severity) {
    case 'error':
      return monaco.MarkerSeverity.Error;
    case 'warning':
      return monaco.MarkerSeverity.Warning;
    case 'info':
    default:
      return monaco.MarkerSeverity.Info;
  }
}

export function diagnosticToMarker(diagnostic: Diagnostic): monaco.editor.IMarkerData {
  const { startLineNumber, startColumn, endLineNumber, endColumn } = toMonacoRange(
    diagnostic.range
  );

  const marker: monaco.editor.IMarkerData = {
    severity: toMarkerSeverity(diagnostic.severity),
    message: diagnostic.message,
    startLineNumber,
    startColumn,
    endLineNumber,
    endColumn,
    source: LINT_MARKER_SOURCE,
  };

  if (diagnostic.ruleId) {
    marker.code = diagnostic.docUrl
      ? { value: diagnostic.ruleId, target: monaco.Uri.parse(diagnostic.docUrl) }
      : diagnostic.ruleId;
  }

  if (diagnostic.hoverFacts) {
    (marker as monaco.editor.IMarkerData & {
      hoverFacts?: DiagnosticHoverFacts;
    }).hoverFacts = diagnostic.hoverFacts;
  }

  return marker;
}
