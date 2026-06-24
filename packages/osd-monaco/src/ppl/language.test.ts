/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LintResult } from './lint/diagnostic';

// mock-prefixed for jest-hoist compatibility.
const mockLintFallback = jest.fn();
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
      registerHoverProvider: jest.fn(),
      registerDocumentRangeFormattingEditProvider: jest.fn(),
    },
    MarkerSeverity: { Error: 8, Warning: 4, Info: 2, Hint: 1 },
    Uri: { parse: (s: string) => s },
  },
}));

// resolvePPLLintResult delegates to fallback so tests control timing.
jest.mock('./lint_bridge', () => ({
  isPPLLintEnabled: () => true,
  getPPLLintContext: () => undefined,
  resolvePPLLintResult: (
    _model: unknown,
    content: string,
    fallback: (q: string) => Promise<LintResult>
  ) => fallback(content),
}));

jest.mock('./worker_proxy_service', () => ({
  PPLWorkerProxyService: class {
    setup = jest.fn();
    lint = (...args: unknown[]) => mockLintFallback(...args);
  },
}));

// Stub validation pass to resolve clean; this test exercises only lint.
jest.mock('./validation_provider', () => ({
  resolvePPLValidationResult: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
}));

// Identity-map ruleId into marker.code so assertions can identify which pass produced them.
jest.mock('./lint/diagnostic_to_marker', () => ({
  diagnosticToMarker: (d: { ruleId: string }) => ({ message: d.ruleId, code: d.ruleId }),
}));
jest.mock('./lint/hover/hover_registry', () => ({
  markerFixKey: (m: { code: string }) => m.code,
  setModelHoverFacts: jest.fn(),
  clearModelHoverFacts: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { revalidatePPLModel } = require('./language');

const PPL_LANGUAGE_ID = 'PPL';

function makeModel(id: string, value = 'source=logs | head 5') {
  return {
    id,
    isDisposed: () => false,
    getValue: () => value,
    getLanguageId: () => PPL_LANGUAGE_ID,
  } as any;
}

const result = (ruleId: string): LintResult => ({
  diagnostics: [
    {
      ruleId,
      severity: 'warning',
      message: ruleId,
      range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
    },
  ],
});

const LINT_OWNER = 'PPL_LINT';

function lintMarkerCalls() {
  return mockSetModelMarkers.mock.calls.filter((c) => c[1] === LINT_OWNER);
}

// Flush microtasks so each lint pass reaches its pending fallback call.
const flush = async (n = 12) => {
  for (let i = 0; i < n; i++) {
    await Promise.resolve();
  }
};

describe('processLintHighlighting — generation guard (stale-response drop)', () => {
  beforeEach(() => {
    mockSetModelMarkers.mockClear();
    mockLintFallback.mockReset();
  });

  it('drops an earlier pass whose response resolves AFTER a later pass', async () => {
    const model = makeModel('m1');

    let resolveStale!: (r: LintResult) => void;
    let resolveFresh!: (r: LintResult) => void;
    const stalePromise = new Promise<LintResult>((r) => (resolveStale = r));
    const freshPromise = new Promise<LintResult>((r) => (resolveFresh = r));
    mockLintFallback.mockReturnValueOnce(stalePromise).mockReturnValueOnce(freshPromise);

    // Fire both passes, then flush so each reaches its pending fallback.
    void revalidatePPLModel(model);
    void revalidatePPLModel(model);
    await flush();
    expect(mockLintFallback).toHaveBeenCalledTimes(2);

    resolveFresh(result('fresh'));
    await flush();

    // Stale pass resolves second; should be dropped.
    resolveStale(result('stale'));
    await flush();

    const calls = lintMarkerCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][2]).toEqual([expect.objectContaining({ code: 'fresh' })]);
  });

  it('applies the response when no newer pass has superseded it', async () => {
    const model = makeModel('m2');
    mockLintFallback.mockResolvedValueOnce(result('only'));

    await revalidatePPLModel(model);
    await flush();

    const calls = lintMarkerCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][2]).toEqual([expect.objectContaining({ code: 'only' })]);
  });

  it('keeps generations independent per model', async () => {
    const a = makeModel('a');
    const b = makeModel('b');
    mockLintFallback
      .mockResolvedValueOnce(result('a-only'))
      .mockResolvedValueOnce(result('b-only'));

    await revalidatePPLModel(a);
    await revalidatePPLModel(b);
    await flush();

    // Generation counter is per-model.
    const owners = lintMarkerCalls().map((c) => c[0].id);
    expect(owners).toEqual(expect.arrayContaining(['a', 'b']));
  });
});
