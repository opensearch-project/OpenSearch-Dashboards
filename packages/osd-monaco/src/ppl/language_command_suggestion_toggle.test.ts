/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLValidationResult } from './ppl_language_analyzer';

// mock-prefixed for jest-hoist compatibility.
const mockValidateFallback = jest.fn();
const mockSetModelMarkers = jest.fn();
let mockLintContext: { commandSuggestionEnabled?: boolean } | undefined;
let mockLintEnabled = true;

jest.mock('../monaco', () => ({
  monaco: {
    editor: {
      setModelMarkers: (...args: unknown[]) => mockSetModelMarkers(...args),
      onDidCreateModel: jest.fn(),
      onWillDisposeModel: jest.fn(),
      getModels: () => [],
      defineTheme: jest.fn(),
    },
    languages: {
      register: jest.fn(),
      onLanguage: jest.fn(),
      setLanguageConfiguration: jest.fn(),
      setMonarchTokensProvider: jest.fn(),
      setTokensProvider: jest.fn(),
      registerCompletionItemProvider: jest.fn(),
      registerCodeActionProvider: jest.fn(),
      registerHoverProvider: jest.fn(),
      registerDocumentRangeFormattingEditProvider: jest.fn(),
    },
    MarkerSeverity: { Error: 8, Warning: 4, Info: 2, Hint: 1 },
    Uri: { parse: (s: string) => s },
  },
}));

jest.mock('./validation_provider', () => ({
  resolvePPLValidationResult: (
    _model: unknown,
    content: string,
    fallback: (q: string) => Promise<PPLValidationResult>
  ) => fallback(content),
}));

// Lint pass disabled via mockLintEnabled so only the syntax channel writes
// markers; the syntax gate reads isPPLLintEnabled + getPPLLintContext for the
// command-suggestion toggle. mockLintEnabled defaults to true so per-context
// toggle tests exercise the normal enabled path; the global-gate test flips it.
jest.mock('./lint_bridge', () => ({
  isPPLLintEnabled: () => mockLintEnabled,
  getPPLLintContext: () => mockLintContext,
  resolvePPLLintResult: () => Promise.resolve({ diagnostics: [] }),
}));

jest.mock('./worker_proxy_service', () => ({
  PPLWorkerProxyService: class {
    setup = jest.fn();
    validate = (...args: unknown[]) => mockValidateFallback(...args);
    stop = jest.fn();
  },
}));

jest.mock('./ppl_documentation', () => ({
  getPPLDocumentationLink: () => ({ url: 'https://example.test/doc' }),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { revalidatePPLModel } = require('./language');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getModelSyntaxFix, markerFixKey } = require('./lint/fix_registry');

const PPL_LANGUAGE_ID = 'PPL';
const SYNTAX_OWNER = 'PPL_WORKER';

function makeModel(id: string) {
  return {
    id,
    uri: `uri://${id}`,
    isDisposed: () => false,
    getValue: () => 'source=logs | wherre x',
    getLanguageId: () => PPL_LANGUAGE_ID,
  } as any;
}

// A command-typo error the way the listeners produce it: friendly message +
// UNKNOWN_COMMAND code + a fix + ANTLR's preserved rawMessage.
const commandTypoResult = (): PPLValidationResult => ({
  isValid: false,
  errors: [
    {
      message: 'Unknown command "wherre". Did you mean "where"?',
      code: 'UNKNOWN_COMMAND',
      fix: { title: 'Replace with "where"', text: 'where' },
      rawMessage: "mismatched input 'wherre' expecting {WHERE, FIELDS}",
      line: 1,
      column: 15,
      endLine: 1,
      endColumn: 21,
    } as any,
  ],
});

function lastSyntaxMarkers() {
  const calls = mockSetModelMarkers.mock.calls.filter((c) => c[1] === SYNTAX_OWNER);
  return calls[calls.length - 1]?.[2] as Array<Record<string, any>>;
}

const flush = async (n = 12) => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};

describe('processSyntaxHighlighting — command-suggestion toggle', () => {
  beforeEach(() => {
    mockSetModelMarkers.mockClear();
    mockValidateFallback.mockReset();
    mockLintContext = undefined;
    mockLintEnabled = true;
  });

  it('keeps the friendly message + fix when the toggle is enabled (default)', async () => {
    mockLintContext = { commandSuggestionEnabled: true };
    mockValidateFallback.mockResolvedValueOnce(commandTypoResult());
    const model = makeModel('c1');

    await revalidatePPLModel(model);
    await flush();

    const markers = lastSyntaxMarkers();
    expect(markers).toHaveLength(1);
    expect(markers[0].message).toBe('Unknown command "wherre". Did you mean "where"?');
    // The quick-fix is registered on the syntax channel.
    expect(getModelSyntaxFix(model, markerFixKey(markers[0]))).toEqual({
      title: 'Replace with "where"',
      text: 'where',
    });
  });

  it('reverts to the raw ANTLR message and drops the fix when the toggle is off', async () => {
    mockLintContext = { commandSuggestionEnabled: false };
    mockValidateFallback.mockResolvedValueOnce(commandTypoResult());
    const model = makeModel('c2');

    await revalidatePPLModel(model);
    await flush();

    const markers = lastSyntaxMarkers();
    expect(markers).toHaveLength(1);
    expect(markers[0].message).toBe("mismatched input 'wherre' expecting {WHERE, FIELDS}");
    // No quick-fix registered when suggestions are off.
    expect(getModelSyntaxFix(model, markerFixKey(markers[0]))).toBeUndefined();
  });

  it('defaults to enabled when no context is present (lint globally on)', async () => {
    mockLintContext = undefined;
    mockValidateFallback.mockResolvedValueOnce(commandTypoResult());
    const model = makeModel('c3');

    await revalidatePPLModel(model);
    await flush();

    const markers = lastSyntaxMarkers();
    expect(markers[0].message).toBe('Unknown command "wherre". Did you mean "where"?');
  });

  it('suppresses the friendly rewrite when the global lint capability is off', async () => {
    mockLintEnabled = false;
    mockLintContext = { commandSuggestionEnabled: true };
    mockValidateFallback.mockResolvedValueOnce(commandTypoResult());
    const model = makeModel('c4');

    await revalidatePPLModel(model);
    await flush();

    const markers = lastSyntaxMarkers();
    expect(markers).toHaveLength(1);
    expect(markers[0].message).toBe("mismatched input 'wherre' expecting {WHERE, FIELDS}");
    expect(getModelSyntaxFix(model, markerFixKey(markers[0]))).toBeUndefined();
  });
});
