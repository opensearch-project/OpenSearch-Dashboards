/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { i18n } from '@osd/i18n';
import type { EditorCompletionProvider } from '../types';

export const INTERVAL_VARIABLE = '$__interval';

/**
 * Suggests the built-in `$__interval` variable when the user types `$` or `${`. The PPL search
 * interceptor replaces it with the histogram's Auto interval for the time range, e.g.
 * `span(@timestamp, $__interval)` -> `span(@timestamp, 30m)`.
 */
export const createIntervalVariableCompletionProvider = (): EditorCompletionProvider => ({
  triggerCharacters: ['$'],
  provideCompletionItems: (model, position) => {
    const offset = model.getOffsetAt(position);
    const textBeforeCursor = model.getValue().substring(0, offset);
    // "$", "$__in", "${", "${__in": the typed prefix is replaced by the suggestion.
    const dollarMatch = textBeforeCursor.match(/\$\{?(\w*)$/);
    if (!dollarMatch || !'__interval'.startsWith(dollarMatch[1])) {
      return [];
    }

    const range = new monaco.Range(
      position.lineNumber,
      position.column - dollarMatch[0].length,
      position.lineNumber,
      position.column
    );

    return [
      {
        label: INTERVAL_VARIABLE,
        kind: monaco.languages.CompletionItemKind.Variable,
        insertText: INTERVAL_VARIABLE,
        filterText: dollarMatch[0].startsWith('${') ? '${__interval}' : INTERVAL_VARIABLE,
        range,
        detail: i18n.translate('explore.queryPanel.intervalVariable.detail', {
          defaultMessage: 'Built-in variable',
        }),
        sortText: '!__interval',
        documentation: {
          value: i18n.translate('explore.queryPanel.intervalVariable.documentation', {
            defaultMessage:
              'Bucket interval for the selected time range, the same one the histogram uses for Auto (e.g. `30m`). Use it in `span(@timestamp, $__interval)`. A dashboard variable named `__interval` takes precedence.',
          }),
        },
      },
    ];
  },
});
