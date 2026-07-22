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

// Marker source tag for syntax-error markers (owner PPL_WORKER). Lets the
// code-action provider recognize the syntax channel and offer command-typo
// quick-fixes there, without disturbing the lint channel (`ppl-lint`).
export const SYNTAX_MARKER_SOURCE = 'ppl-syntax';

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

  // Attach the quick-fix payload the code-action provider reads off the marker.
  // An explicit fix range is converted to Monaco coordinates here; when absent,
  // the provider falls back to the marker's own range. This transient property
  // does not survive Monaco's MarkerService rebuild; language.ts moves it into
  // the fix side table before calling setModelMarkers.
  if (diagnostic.fix) {
    (
      marker as monaco.editor.IMarkerData & {
        fix?: { title: string; text: string; range?: MonacoRange };
      }
    ).fix = {
      title: diagnostic.fix.title,
      text: diagnostic.fix.text,
      range: diagnostic.fix.range ? toMonacoRange(diagnostic.fix.range) : undefined,
    };
  }

  if (diagnostic.hoverFacts) {
    (
      marker as monaco.editor.IMarkerData & {
        hoverFacts?: DiagnosticHoverFacts;
      }
    ).hoverFacts = diagnostic.hoverFacts;
  }

  return marker;
}
