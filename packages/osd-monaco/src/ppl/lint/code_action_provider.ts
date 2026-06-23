/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '../../monaco';
import { LINT_MARKER_SOURCE, SYNTAX_MARKER_SOURCE } from './diagnostic_to_marker';
import { getModelFix, getModelSyntaxFix, markerFixKey } from './fix_registry';

/**
 * Quick-fix provider for PPL lint and syntax markers. Reads fixes from a side
 * table (Monaco's MarkerService drops custom marker properties on rebuild).
 */
export const pplLintCodeActionProvider: monaco.languages.CodeActionProvider = {
  provideCodeActions(
    model: monaco.editor.ITextModel,
    _range: monaco.Range,
    context: monaco.languages.CodeActionContext
  ): monaco.languages.ProviderResult<monaco.languages.CodeActionList> {
    const actions: monaco.languages.CodeAction[] = [];

    for (const marker of context.markers) {
      const key = markerFixKey(marker);
      let fix;
      if (marker.source === LINT_MARKER_SOURCE) {
        fix = getModelFix(model, key);
      } else if (marker.source === SYNTAX_MARKER_SOURCE) {
        fix = getModelSyntaxFix(model, key);
      } else {
        continue;
      }

      if (!fix) {
        continue;
      }

      const editRange = fix.range ?? {
        startLineNumber: marker.startLineNumber,
        startColumn: marker.startColumn,
        endLineNumber: marker.endLineNumber,
        endColumn: marker.endColumn,
      };

      actions.push({
        title: fix.title,
        diagnostics: [marker],
        kind: 'quickfix',
        edit: {
          edits: [
            {
              resource: model.uri,

              textEdit: {
                range: editRange,
                text: fix.text,
              },
              versionId: model.getVersionId(),
            } as any,
          ],
        },
      });
    }

    return {
      actions,
      dispose: () => {},
    };
  },
};
