/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../monaco';
import { LINT_MARKER_SOURCE } from '../diagnostic_to_marker';
import { getModelHoverFacts, markerFixKey } from './hover_registry';
import { getRuleHoverContent } from './engine_outcomes';
import { renderHoverCard, SeverityLabel } from './hover_card';
import { collectPPLDiagnosticActions, DiagnosticAction } from '../diagnostic_action';
import { getCatalogEntryById } from '../catalog';

// Restrict command ids so a contributor can't reshape the `command:` URI to smuggle a different command/args.
const SAFE_COMMAND_ID = /^[\w.-]+$/;

// Escape markdown so a contributor title can't break out of the link and inject its own `command:` link.
function escapeMarkdownLinkText(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!|<>~]/g, '\\$&').replace(/[\r\n]+/g, ' ');
}

// Returned as a SEPARATE trusted part so the main hover card stays untrusted; only these guarded links are trusted.
function renderContributedActions(actions: DiagnosticAction[]): monaco.IMarkdownString | undefined {
  const links = actions
    .filter((action) => SAFE_COMMAND_ID.test(action.commandId))
    .map((action) => {
      const args = encodeURIComponent(JSON.stringify(action.args ?? []));
      return `[${escapeMarkdownLinkText(action.title)}](command:${action.commandId}?${args})`;
    })
    .join(' &nbsp;·&nbsp; ');
  return links.length > 0 ? { value: links, isTrusted: true } : undefined;
}

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

    const entry = ruleId ? getCatalogEntryById(ruleId) : undefined;
    const contributedActions = renderContributedActions(
      collectPPLDiagnosticActions({
        marker,
        model,
        ruleId,
        aiFixable: entry?.aiFixable,
        needsExplain: entry?.needsExplain,
      })
    );

    const contents: monaco.IMarkdownString[] = [
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
    ];
    if (contributedActions) {
      contents.push(contributedActions);
    }

    return {
      range: {
        startLineNumber: marker.startLineNumber,
        startColumn: marker.startColumn,
        endLineNumber: marker.endLineNumber,
        endColumn: marker.endColumn,
      },
      contents,
    };
  },
};
