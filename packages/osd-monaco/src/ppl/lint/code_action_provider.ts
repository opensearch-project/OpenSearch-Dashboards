/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../monaco';
import { LINT_MARKER_SOURCE, SYNTAX_MARKER_SOURCE } from './diagnostic_to_marker';
import { getModelFix, getModelSyntaxFix, markerFixKey, MarkerFix } from './fix_registry';
import { collectPPLDiagnosticActions } from './diagnostic_action';
import { getCatalogEntryById } from './catalog';

/** Resolve a marker's catalog rule id from its `code` field (string or link). */
function ruleIdOfMarker(marker: monaco.editor.IMarkerData): string | undefined {
  const { code } = marker;
  if (typeof code === 'string') {
    return code;
  }
  return code && typeof code === 'object' && typeof code.value === 'string'
    ? code.value
    : undefined;
}

// Code-action provider that surfaces quick-fixes for PPL markers on two
// channels: lint diagnostics (`ppl-lint`, owner PPL_LINT) and syntax errors
// (`ppl-syntax`, owner PPL_WORKER — e.g. the command-typo suggestion). For each
// marker with an associated fix it returns a quick-fix code action with a
// workspace edit. Markers from any other source are ignored.
//
// The fix payload is NOT read off the marker: Monaco's MarkerService rebuilds
// each marker from a fixed field list when `setModelMarkers` is called, dropping
// any custom property, so a fix hung off the marker never survives to here.
// Instead each lifecycle records fixes in a side table keyed by the marker
// fields the service preserves (range + message + rule id); we re-associate them
// here, reading the table that matches the marker's source.
export const pplLintCodeActionProvider: monaco.languages.CodeActionProvider = {
  provideCodeActions(
    model: monaco.editor.ITextModel,
    _range: monaco.Range,
    context: monaco.languages.CodeActionContext
  ): monaco.languages.ProviderResult<monaco.languages.CodeActionList> {
    const actions: monaco.languages.CodeAction[] = [];

    for (const marker of context.markers) {
      const key = markerFixKey(marker);
      let fix: MarkerFix | undefined;
      if (marker.source === LINT_MARKER_SOURCE) {
        fix = getModelFix(model, key);
      } else if (marker.source === SYNTAX_MARKER_SOURCE) {
        fix = getModelSyntaxFix(model, key);
      } else {
        continue;
      }

      // Contributed actions (e.g. an AI-assisted fix) are offered on lint
      // markers regardless of whether a deterministic fix exists. They read only
      // neutral, catalog-owned metadata, so no rule module is imported here.
      if (marker.source === LINT_MARKER_SOURCE) {
        const ruleId = ruleIdOfMarker(marker);
        const entry = ruleId ? getCatalogEntryById(ruleId) : undefined;
        const contributed = collectPPLDiagnosticActions({
          marker,
          model,
          ruleId,
          aiFixable: entry?.aiFixable,
          needsExplain: entry?.needsExplain,
        });
        for (const action of contributed) {
          actions.push({
            title: action.title,
            diagnostics: [marker],
            kind: 'quickfix',
            command: {
              id: action.commandId,
              title: action.title,
              arguments: action.args,
            },
          });
        }
      }

      if (!fix) {
        continue;
      }

      // Use the fix's own range when it targets a span different from the
      // squiggle (e.g. deleting one character before the underlined name);
      // otherwise replace the marker's range.
      const editRange = fix.range ?? {
        startLineNumber: marker.startLineNumber,
        startColumn: marker.startColumn,
        endLineNumber: marker.endLineNumber,
        endColumn: marker.endColumn,
      };

      const textEdit: monaco.languages.IWorkspaceTextEdit = {
        resource: model.uri,
        textEdit: {
          range: editRange,
          text: fix.text,
        },
        // Intentionally omit versionId. Monaco's bulk-edit service rejects an
        // edit whose captured versionId no longer matches the model ("model
        // changed in the meantime"), and in the live editor the version advances
        // between the moment the code action is computed and the moment the user
        // clicks it (debounced re-lint, re-tokenize, autocomplete all bump it) —
        // so a captured versionId makes the quick-fix silently do nothing. The
        // fix range is absolute, so applying it without the version guard is safe.
        versionId: undefined,
      };

      actions.push({
        title: fix.title,
        diagnostics: [marker],
        kind: 'quickfix',
        edit: {
          edits: [textEdit],
        },
      });
    }

    return {
      actions,
      dispose: () => {},
    };
  },
};
