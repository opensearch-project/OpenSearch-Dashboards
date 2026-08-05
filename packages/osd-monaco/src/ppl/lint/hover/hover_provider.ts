/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../../monaco';
import { LINT_MARKER_SOURCE, ruleIdOf } from '../diagnostic_to_marker';
import { getModelFix, markerFixKey } from '../fix_registry';
import { renderHoverCard } from './hover_card';
import { collectPPLDiagnosticActions, DiagnosticAction } from '../diagnostic_action';
import { getCatalogEntryById } from '../catalog';
import {
  emitPPLLintTelemetry,
  PPL_LINT_TELEMETRY_EVENTS,
  shouldEmitHoverShown,
} from '../telemetry';

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
    const key = markerFixKey(marker);
    const fix = getModelFix(model, key);

    // Hover guidance is bundled presentation metadata, not the execution-time
    // merged rule config used by runLint/headless callers.
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

    const card = renderHoverCard({
      docUrl: docUrlOf(marker),
      howToFix: entry?.howToFix,
      fixText: fix?.text,
    });
    const contents: monaco.IMarkdownString[] = [];
    if (card) {
      contents.push({ value: card, isTrusted: false });
    }
    if (contributedActions) {
      contents.push(contributedActions);
    }
    // Monaco's built-in marker participant still renders the diagnostic. Do not
    // add an empty custom row when this marker has no supplemental guidance.
    if (contents.length === 0) {
      return null;
    }

    // Feature-usage telemetry: the user hovered a lint marker and a card is
    // being returned. Emitted only on the card-returned path (not the null/no-
    // marker branch above), and deduped for the exact marker while it remains
    // active so Monaco's per-character re-invocation counts one hover, not mouse
    // travel or accepted lint passes. No-ops until the host registers a sink.
    if (shouldEmitHoverShown(model, key)) {
      emitPPLLintTelemetry({
        name: PPL_LINT_TELEMETRY_EVENTS.HOVER_SHOWN,
        data: { rule: ruleId },
      });
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
