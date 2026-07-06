/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../monaco';
import { LINT_MARKER_SOURCE, ruleIdOf, SYNTAX_MARKER_SOURCE } from './diagnostic_to_marker';
import { getModelFix, getModelSyntaxFix, markerFixKey, MarkerFix } from './fix_registry';
import { collectPPLDiagnosticActions } from './diagnostic_action';
import { getCatalogEntryById } from './catalog';
import {
  emitPPLLintTelemetry,
  PPL_LINT_QUICKFIX_COMMAND_ID,
  PPL_LINT_TELEMETRY_EVENTS,
  shouldEmitQuickfixOffered,
} from './telemetry';

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
      const isLintMarker = marker.source === LINT_MARKER_SOURCE;
      if (isLintMarker) {
        fix = getModelFix(model, key);
      } else if (marker.source === SYNTAX_MARKER_SOURCE) {
        fix = getModelSyntaxFix(model, key);
      } else {
        continue;
      }

      // Contributed actions (e.g. AI-assisted fix) run even without a deterministic
      // fix and read only catalog metadata, so no rule module is imported here.
      if (marker.source === LINT_MARKER_SOURCE) {
        const ruleId = ruleIdOf(marker);
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

      const action: monaco.languages.CodeAction = {
        title: fix.title,
        diagnostics: [marker],
        kind: 'quickfix',
        edit: {
          edits: [textEdit],
        },
      };

      // Lint quick-fixes carry a telemetry command so a `quickfix_clicked` event
      // can be recorded when the fix is invoked. Monaco applies the edit before
      // running the command, so the fix behavior is unchanged. Only the lint
      // channel is instrumented; the syntax-error command-typo fix is not part
      // of the lint feature-usage metrics.
      if (isLintMarker) {
        const rule = ruleIdOf(marker);
        action.command = {
          id: PPL_LINT_QUICKFIX_COMMAND_ID,
          title: fix.title,
          arguments: [{ rule }],
        };
        // Deduped per marker per lint pass: Monaco auto-triggers
        // provideCodeActions on every cursor move over a marker, so emitting on
        // each call would count caret ticks, not offers. `key` is the marker's
        // canonical identity (position + message).
        if (shouldEmitQuickfixOffered(model, key)) {
          emitPPLLintTelemetry({
            name: PPL_LINT_TELEMETRY_EVENTS.QUICKFIX_OFFERED,
            data: { rule },
          });
        }
      }

      actions.push(action);
    }

    return {
      actions,
      dispose: () => {},
    };
  },
};
