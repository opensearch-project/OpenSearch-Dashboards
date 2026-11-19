/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

jest.mock('@osd/monaco', () => ({
  monaco: {
    Range: jest.fn((sl: number, sc: number, el: number, ec: number) => ({ sl, sc, el, ec })),
    languages: {
      CompletionItemKind: { Variable: 4 },
    },
  },
}));

import { createIntervalVariableCompletionProvider } from './interval_variable_completion_provider';

const suggest = (text: string) =>
  createIntervalVariableCompletionProvider().provideCompletionItems(
    { getValue: () => text, getOffsetAt: () => text.length } as any,
    { lineNumber: 1, column: text.length + 1 } as any,
    {} as any,
    {} as any
  ) as any[];

describe('createIntervalVariableCompletionProvider', () => {
  it('triggers on "$"', () => {
    expect(createIntervalVariableCompletionProvider().triggerCharacters).toEqual(['$']);
  });

  it('suggests $__interval after "$", replacing the typed prefix', () => {
    const items = suggest('source=logs | stats count() by span(@timestamp, $');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ label: '$__interval', insertText: '$__interval', kind: 4 });
    // The range starts at the "$": column of "$" is text.length (1-based), cursor at length + 1.
    expect(items[0].range.sc).toBe('source=logs | stats count() by span(@timestamp, $'.length);
  });

  it('matches a partial name and the "${" prefix', () => {
    expect(suggest('span(t, $__int').map((i) => i.label)).toEqual(['$__interval']);
    expect(suggest('span(t, ${__in').map((i) => i.label)).toEqual(['$__interval']);
  });

  it('suggests nothing for another name or without "$"', () => {
    expect(suggest('where s = $serv')).toEqual([]);
    expect(suggest('source=logs')).toEqual([]);
  });
});
