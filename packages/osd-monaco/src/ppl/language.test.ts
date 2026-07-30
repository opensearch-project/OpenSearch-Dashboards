/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LintResult } from './lint/diagnostic';
import {
  PPLLintTelemetryEvent,
  PPL_LINT_TELEMETRY_EVENTS,
  registerPPLLintTelemetry,
} from './lint/telemetry';

// mock-prefixed for jest-hoist compatibility.
const mockLintFallback = jest.fn();
const mockSetModelMarkers = jest.fn();
const mockGetPPLLintContext = jest.fn();

jest.mock('../monaco', () => ({
  monaco: {
    editor: {
      setModelMarkers: (...args: unknown[]) => mockSetModelMarkers(...args),
      onDidCreateModel: jest.fn(),
      onWillDisposeModel: jest.fn(),
      getModels: () => [],
      defineTheme: jest.fn(),
      registerCommand: jest.fn(() => ({ dispose: jest.fn() })),
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

// resolvePPLLintResult delegates to fallback so tests control timing.
jest.mock('./lint_bridge', () => ({
  isPPLLintEnabled: () => true,
  getPPLLintContext: (...args: unknown[]) => mockGetPPLLintContext(...args),
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
    mockGetPPLLintContext.mockReset();
    mockGetPPLLintContext.mockReturnValue(undefined);
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

describe('worker context serialization (structured-clone safety)', () => {
  beforeEach(() => {
    mockSetModelMarkers.mockClear();
    mockLintFallback.mockReset();
    mockLintFallback.mockResolvedValue({ diagnostics: [] });
    mockGetPPLLintContext.mockReset();
  });

  it('flattens the typeMap Map to a plain object for the compiled worker', async () => {
    mockGetPPLLintContext.mockReturnValue({
      isCalcite: true,
      fields: new Set(['name', 'age']),
      typeMap: new Map([
        ['name', 'text'],
        ['age', 'long'],
      ]),
    });

    await revalidatePPLModel(makeModel('serialize-1'));
    await flush();

    expect(mockLintFallback).toHaveBeenCalledTimes(1);
    const workerContext = mockLintFallback.mock.calls[0][1];
    // Map -> plain object, Set -> array; both must be structured-clone-safe.
    expect(workerContext.typeMap).toEqual({ name: 'text', age: 'long' });
    expect(workerContext.typeMap instanceof Map).toBe(false);
    expect(Array.isArray(workerContext.fields)).toBe(true);
  });

  it('leaves typeMap undefined in the worker context when the host has none', async () => {
    mockGetPPLLintContext.mockReturnValue({
      isCalcite: true,
      fields: new Set(['name']),
    });

    await revalidatePPLModel(makeModel('serialize-2'));
    await flush();

    const workerContext = mockLintFallback.mock.calls[0][1];
    expect(workerContext.typeMap).toBeUndefined();
  });
});

describe('processLintHighlighting — diagnostic_shown telemetry', () => {
  let events: PPLLintTelemetryEvent[];
  beforeEach(() => {
    mockSetModelMarkers.mockClear();
    mockLintFallback.mockReset();
    events = [];
    registerPPLLintTelemetry((event) => events.push(event));
  });
  afterEach(() => registerPPLLintTelemetry(undefined));

  // A LintResult with an explicit list of diagnostics (possibly repeating a
  // rule) so we can assert the per-rule dedup.
  const multiResult = (ruleIds: string[]): LintResult => ({
    diagnostics: ruleIds.map((ruleId) => ({
      ruleId,
      severity: 'warning',
      message: ruleId,
      range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
    })),
  });

  it('emits diagnostic_shown once per distinct rule after markers are applied', async () => {
    const model = makeModel('t1');
    // Two findings of one rule + one of another → two events, deduped.
    mockLintFallback.mockResolvedValueOnce(
      multiResult(['division-by-zero', 'division-by-zero', 'head-without-sort'])
    );

    await revalidatePPLModel(model);
    await flush();

    expect(events).toEqual([
      { name: PPL_LINT_TELEMETRY_EVENTS.DIAGNOSTIC_SHOWN, data: { rule: 'division-by-zero' } },
      { name: PPL_LINT_TELEMETRY_EVENTS.DIAGNOSTIC_SHOWN, data: { rule: 'head-without-sort' } },
    ]);
  });

  it('emits nothing when the pass produces no diagnostics', async () => {
    const model = makeModel('t2');
    mockLintFallback.mockResolvedValueOnce({ diagnostics: [] });

    await revalidatePPLModel(model);
    await flush();

    expect(events).toHaveLength(0);
  });
});
