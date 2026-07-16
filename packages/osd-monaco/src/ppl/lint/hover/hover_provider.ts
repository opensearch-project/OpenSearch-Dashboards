/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../monaco';
import { LINT_MARKER_SOURCE } from '../diagnostic_to_marker';
import { getModelHoverFacts, markerFixKey } from './hover_registry';
import { getRuleHoverContent } from './engine_outcomes';
import { renderHoverCard, SeverityLabel } from './hover_card';

export const LINT_OWNER = 'PPL_LINT';

function severityLabel(severity: monaco.MarkerSeverity): SeverityLabel {
  switch (severity) {
    case monaco.MarkerSeverity.Error:
      return 'Error';
    case monaco.MarkerSeverity.Warning:
      return 'Warning';
    default:
      return 'Info';
  }
}

function ruleIdOf(marker: monaco.editor.IMarker): string | undefined {
  const code = marker.code;
  if (typeof code === 'string') return code;
  return code && typeof code === 'object' && typeof code.value === 'string'
    ? code.value
    : undefined;
}

function docUrlOf(marker: monaco.editor.IMarker): string | undefined {
  const code = marker.code;
  return code && typeof code === 'object' && code.target ? code.target.toString() : undefined;
}

function markerContainsPosition(marker: monaco.editor.IMarker, position: monaco.Position): boolean {
  const { lineNumber, column } = position;
  return !(
    lineNumber < marker.startLineNumber ||
    lineNumber > marker.endLineNumber ||
    (lineNumber === marker.startLineNumber && column < marker.startColumn) ||
    (lineNumber === marker.endLineNumber && column > marker.endColumn)
  );
}

function markerSpan(marker: monaco.editor.IMarker): number {
  return (
    (marker.endLineNumber - marker.startLineNumber) * 100000 +
    (marker.endColumn - marker.startColumn)
  );
}

export const pplLintHoverProvider: monaco.languages.HoverProvider = {
  provideHover(model: monaco.editor.ITextModel, position: monaco.Position) {
    const markers = monaco.editor
      .getModelMarkers({ owner: LINT_OWNER, resource: model.uri })
      .filter((marker) => marker.source === LINT_MARKER_SOURCE)
      .filter((marker) => markerContainsPosition(marker, position));

    if (markers.length === 0) {
      return null;
    }

    const marker = markers.reduce((a, b) => (markerSpan(b) < markerSpan(a) ? b : a));

    const ruleId = ruleIdOf(marker);
    const facts = getModelHoverFacts(model, markerFixKey(marker));

    return {
      range: {
        startLineNumber: marker.startLineNumber,
        startColumn: marker.startColumn,
        endLineNumber: marker.endLineNumber,
        endColumn: marker.endColumn,
      },
      contents: [
        {
          value: renderHoverCard({
            ruleId: ruleId ?? 'ppl-lint',
            severityLabel: severityLabel(marker.severity),
            message: marker.message,
            docUrl: docUrlOf(marker),
            content: ruleId ? getRuleHoverContent(ruleId) : undefined,
            facts,
          }),
          isTrusted: false,
        },
      ],
    };
  },
};
