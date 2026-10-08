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

import { createVariableCompletionProvider } from './variable_completion_provider';

const makeModel = (text: string) =>
  ({
    getValue: () => text,
    getOffsetAt: () => text.length,
  }) as any;

const callProvider = (provider: any, text: string) =>
  provider.provideCompletionItems(
    makeModel(text),
    { lineNumber: 1, column: text.length + 1 } as any,
    {} as any,
    {} as any
  ) as any[];

describe('createVariableCompletionProvider', () => {
  it('exposes "$" as a trigger character', () => {
    expect(createVariableCompletionProvider(() => []).triggerCharacters).toEqual(['$']);
  });

  it('suggests ${var} items when the caret follows "$"', () => {
    const provider = createVariableCompletionProvider(() => ['env', 'service']);
    const items = callProvider(provider, 'source=logs | where svc=$');

    expect(items.map((i) => i.label)).toEqual(['${env}', '${service}']);
    expect(items[0].insertText).toBe('${env}');
    expect(items[0].detail).toBe('Dashboard variable');
    expect(items[0].kind).toBe(4); // CompletionItemKind.Variable (mocked)
  });

  it('also matches the "${" prefix', () => {
    const provider = createVariableCompletionProvider(() => ['env']);
    const items = callProvider(provider, 'svc=${');
    expect(items.map((i) => i.label)).toEqual(['${env}']);
  });

  it('returns [] when the caret is not after a "$"', () => {
    const provider = createVariableCompletionProvider(() => ['env']);
    expect(callProvider(provider, 'source=logs')).toEqual([]);
  });

  it('returns [] when there are no variable names', () => {
    const provider = createVariableCompletionProvider(() => []);
    expect(callProvider(provider, 'svc=$')).toEqual([]);
  });

  it('reads variable names lazily at completion time', () => {
    let names: string[] = ['a'];
    const provider = createVariableCompletionProvider(() => names);
    expect(callProvider(provider, 'x=$').map((i) => i.label)).toEqual(['${a}']);
    names = ['a', 'b'];
    expect(callProvider(provider, 'x=$').map((i) => i.label)).toEqual(['${a}', '${b}']);
  });
});
