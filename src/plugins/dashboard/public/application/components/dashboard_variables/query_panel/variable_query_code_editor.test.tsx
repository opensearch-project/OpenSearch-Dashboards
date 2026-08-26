/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount } from 'enzyme';

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  CodeEditor: (props: any) => {
    (globalThis as any).__capturedSuggestionProvider = props.suggestionProvider;
    return null;
  },
}));

const getCapturedProvider = () => (globalThis as any).__capturedSuggestionProvider;

jest.mock('@osd/monaco', () => {
  class FakeRange {
    constructor(a: number, b: number, c: number, d: number) {
      Object.assign(this, {
        startLineNumber: a,
        startColumn: b,
        endLineNumber: c,
        endColumn: d,
      });
    }
  }
  return {
    monaco: {
      Range: FakeRange,
      languages: {
        CompletionItemKind: { Variable: 'Variable' },
      },
    },
  };
});

jest.mock('../../../../../../data/public', () => ({
  getEffectiveLanguageForAutoComplete: (lang: string) => lang,
}));

jest.mock('../../../../../../data/common', () => ({
  DEFAULT_DATA: { SET_TYPES: { INDEX_PATTERN: 'INDEX_PATTERN' } },
}));

import { VariableQueryCodeEditor } from './variable_query_code_editor';

/**
 * A fake monaco text model + position whose cursor sits right after a `${` prefix,
 * so provideCompletionItems takes the ${variable} suggestion branch.
 */
function makeModelAndPosition(text: string) {
  const position = { lineNumber: 1, column: text.length + 1 } as any;
  const model = {
    getValue: () => text,
    getOffsetAt: () => text.length,
    getWordUntilPosition: () => ({ startColumn: 1, endColumn: text.length + 1 }),
    getValueInRange: () => text,
  } as any;
  return { model, position };
}

function renderEditor(dataOverrides: any = {}) {
  const data = {
    query: { queryString: { getQuery: () => ({ dataset: undefined }) } },
    dataViews: { get: jest.fn() },
    autocomplete: {
      getQuerySuggestions: jest.fn().mockResolvedValue([]),
      getTriggerCharacters: jest.fn().mockReturnValue([' ']),
    },
    ...dataOverrides,
  };

  mount(
    <VariableQueryCodeEditor
      language="PPL"
      query=""
      onQueryChange={jest.fn()}
      dataset={{ id: 'ds-1', title: 'logs', type: 'INDEX_PATTERN' } as any}
      existingVariableNames={['myVar']}
      onRunQuery={jest.fn()}
      data={data as any}
      services={{} as any}
    />
  );

  return { data };
}

const noopToken = { isCancellationRequested: false } as any;

describe('VariableQueryCodeEditor — provideCompletionItems dataView failure tolerance', () => {
  beforeEach(() => {
    (globalThis as any).__capturedSuggestionProvider = undefined;
  });

  it('returns ${variable} suggestions on the happy path', async () => {
    renderEditor({
      dataViews: { get: jest.fn().mockResolvedValue({ id: 'ds-1', title: 'logs' }) },
    });

    const { model, position } = makeModelAndPosition('${');
    const result = await getCapturedProvider().provideCompletionItems(
      model,
      position,
      {} as any,
      noopToken
    );

    expect(result.suggestions.map((s: any) => s.label)).toContain('${myVar}');
  });
});
