/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLValidationResult } from './ppl_language_analyzer';

// mock-prefixed for jest-hoist compatibility.
const mockValidateFallback = jest.fn();
const mockSetModelMarkers = jest.fn();

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

// resolvePPLValidationResult delegates to a fallback so the test controls timing
// of the syntax (validation) pass — the path the staleness guard protects.
jest.mock('./validation_provider', () => ({
  resolvePPLValidationResult: (
    _model: unknown,
    content: string,
    fallback: (q: string) => Promise<PPLValidationResult>
  ) => fallback(content),
}));

// Lint pass is disabled here so only the syntax channel writes markers.
jest.mock('./lint_bridge', () => ({
  isPPLLintEnabled: () => false,
  getPPLLintContext: () => undefined,
  resolvePPLLintResult: jest.fn(),
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

const PPL_LANGUAGE_ID = 'PPL';
const SYNTAX_OWNER = 'PPL_WORKER';

function makeModel(id: string, value = 'source=logs | wherre x') {
  return {
    id,
    isDisposed: () => false,
    getValue: () => value,
    getLanguageId: () => PPL_LANGUAGE_ID,
  } as any;
}

// A validation result with a single error whose message is `tag` so the test can
// tell which pass produced the surviving markers.
const errResult = (tag: string): PPLValidationResult => ({
  isValid: false,
  errors: [{ message: tag, line: 1, column: 0, endLine: 1, endColumn: 1 }],
});

function syntaxMarkerCalls() {
  return mockSetModelMarkers.mock.calls.filter((c) => c[1] === SYNTAX_OWNER);
}

const flush = async (n = 12) => {
  for (let i = 0; i < n; i++) {
    await Promise.resolve();
  }
};

describe('processSyntaxHighlighting — generation guard (stale-response drop)', () => {
  beforeEach(() => {
    mockSetModelMarkers.mockClear();
    mockValidateFallback.mockReset();
  });

  it('drops an earlier syntax pass whose response resolves AFTER a later pass', async () => {
    const model = makeModel('s1');

    let resolveStale!: (r: PPLValidationResult) => void;
    let resolveFresh!: (r: PPLValidationResult) => void;
    const stalePromise = new Promise<PPLValidationResult>((r) => (resolveStale = r));
    const freshPromise = new Promise<PPLValidationResult>((r) => (resolveFresh = r));
    mockValidateFallback.mockReturnValueOnce(stalePromise).mockReturnValueOnce(freshPromise);

    void revalidatePPLModel(model);
    void revalidatePPLModel(model);
    await flush();
    expect(mockValidateFallback).toHaveBeenCalledTimes(2);

    resolveFresh(errResult('fresh'));
    await flush();

    // Stale pass resolves second; the guard must drop it.
    resolveStale(errResult('stale'));
    await flush();

    const calls = syntaxMarkerCalls();
    // The fresh pass writes once; the stale pass is dropped (no second write).
    expect(calls).toHaveLength(1);
    expect(calls[0][2]).toEqual([expect.objectContaining({ message: 'fresh' })]);
  });

  it('applies the response when no newer pass has superseded it', async () => {
    const model = makeModel('s2');
    mockValidateFallback.mockResolvedValueOnce(errResult('only'));

    await revalidatePPLModel(model);
    await flush();

    const calls = syntaxMarkerCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][2]).toEqual([expect.objectContaining({ message: 'only' })]);
  });
});
