/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import type { EditorCompletionProvider } from '../../../components/query_panel/query_panel_editor/types';

/**
 * Completion extension that suggests dashboard variables (`${var}`) when the user types
 * `$` or `${`.
 */
export const createVariableCompletionProvider = (
  getVariableNames: () => string[]
): EditorCompletionProvider => ({
  triggerCharacters: ['$'],
  provideCompletionItems: (model, position) => {
    const variableNames = getVariableNames();
    if (!variableNames.length) {
      return [];
    }

    const offset = model.getOffsetAt(position);
    const textBeforeCursor = model.getValue().substring(0, offset);
    const dollarMatch = textBeforeCursor.match(/\$\{?(\w*)$/);
    if (!dollarMatch) {
      return [];
    }

    const fullPrefix = dollarMatch[0]; // e.g. "$", "$se", "${", "${se"
    const range = new monaco.Range(
      position.lineNumber,
      position.column - fullPrefix.length,
      position.lineNumber,
      position.column
    );

    return variableNames.map((name) => ({
      label: `\${${name}}`,
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: `\${${name}}`,
      insertTextRules: undefined,
      range,
      detail: 'Dashboard variable',
      sortText: `!${name}`,
      documentation: {
        value: `Reference variable **${name}** — will be replaced at query time`,
        isTrusted: true,
      },
      command: {
        id: 'editor.action.triggerSuggest',
        title: 'Trigger Next Suggestion',
      },
    }));
  },
});
