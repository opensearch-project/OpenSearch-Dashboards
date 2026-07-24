/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LintResult } from './lint/diagnostic';
import type { PPLLintContext } from './lint_bridge';

// mock-prefixed for jest-hoist compatibility.
const mockSetModelMarkers = jest.fn();
const mockHttpPost = jest.fn();
let mockLintContext: PPLLintContext | undefined;

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

// resolvePPLLintResult delegates to the fallback so the test controls the static
// diagnostics; getPPLLintContext returns the per-test context (with http).
jest.mock('./lint_bridge', () => ({
  isPPLLintEnabled: () => true,
  getPPLLintContext: () => mockLintContext,
  resolvePPLLintResult: (
    _model: unknown,
    _content: string,
    fallback: (q: string) => Promise<LintResult>
  ) => fallback(_content),
}));

// Static fallback returns a single head-without-sort diagnostic. analyzeLint
// builds a REAL attribution snapshot from the compiled grammar for the content
// under test, so the explain layer can narrow the whole-query finding to the
// actual `where` command; validateLintQueries accepts every probe.
jest.mock('./worker_proxy_service', () => {
  /* eslint-disable @typescript-eslint/no-var-requires */
  const {
    SimplifiedOpenSearchPPLLexer,
    SimplifiedOpenSearchPPLParser,
  } = require('@osd/antlr-grammar');
  const { CharStream, CommonTokenStream } = require('antlr4ng');
  const { buildExplainAttributionSnapshot } = require('./lint/explain/attribution/candidates');
  const { createCompiledRuleNameToIndex } = require('./lint/rule_index');
  /* eslint-enable @typescript-eslint/no-var-requires */
  return {
    PPLWorkerProxyService: class {
      setup = jest.fn();
      lint = async () => ({
        diagnostics: [
          {
            ruleId: 'head-without-sort',
            severity: 'info',
            message: 'head-without-sort',
            range: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 1 },
          },
        ],
      });
      analyzeLint = async (content: string) => {
        const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(content));
        lexer.removeErrorListeners();
        const parser = new SimplifiedOpenSearchPPLParser(new CommonTokenStream(lexer));
        parser.removeErrorListeners();
        return {
          result: { diagnostics: [] },
          attribution: buildExplainAttributionSnapshot(
            parser.root(),
            createCompiledRuleNameToIndex(),
            content
          ),
        };
      };
      validateLintQueries = async (queries: string[]) => queries.map(() => true);
    },
  };
});

jest.mock('./validation_provider', () => ({
  resolvePPLValidationResult: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
}));

// Identity-map ruleId into marker.code so assertions identify which pass produced
// each marker; markerFixKey uses the same code.
jest.mock('./lint/diagnostic_to_marker', () => ({
  diagnosticToMarker: (d: { ruleId: string; range: unknown }) => ({
    message: d.ruleId,
    code: d.ruleId,
    range: d.range,
  }),
  SYNTAX_MARKER_SOURCE: 'ppl-syntax',
}));
jest.mock('./lint/hover/hover_registry', () => ({
  markerFixKey: (m: { code: string }) => m.code,
  setModelHoverFacts: jest.fn(),
  clearModelHoverFacts: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { revalidatePPLModel } = require('./language');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { explainCache } = require('./lint/explain/explain_cache');

const PPL_LANGUAGE_ID = 'PPL';
const LINT_OWNER = 'PPL_LINT';

function makeModel(id: string, value = 'source=logs | where age > 30') {
  return {
    id,
    isDisposed: () => false,
    getValue: () => value,
    getLanguageId: () => PPL_LANGUAGE_ID,
  } as any;
}

// A Calcite physical plan whose filter fell back to the coordinator (a residual
// $condition Calc rel with no FILTER-> pushdown tag) → operation-not-pushed.
const NOT_PUSHED_PLAN = {
  calcite: {
    physical: {
      rels: [
        {
          id: '1',
          relOp: 'EnumerableCalc',
          $condition: '>($0, 30)',
        },
      ],
    },
  },
};

// operation-not-pushed ships enabled by default; this pins it on explicitly so
// the positive-path tests don't depend on the shipped catalog default.
const ENABLE_NOT_PUSHED = { 'operation-not-pushed': { enabled: true } };

// Turns both explain rules off, exercising the no-network path when the user has
// disabled them.
const DISABLE_EXPLAIN = {
  'operation-not-pushed': { enabled: false },
  'operation-pushed-as-script': { enabled: false },
};

function httpClient() {
  return { post: (...args: unknown[]) => mockHttpPost(...args) };
}

function lintMarkerCalls() {
  return mockSetModelMarkers.mock.calls.filter((c) => c[1] === LINT_OWNER);
}

const flush = async (n = 60) => {
  for (let i = 0; i < n; i++) await Promise.resolve();
};

describe('processLintHighlighting — explain layer', () => {
  beforeEach(() => {
    mockSetModelMarkers.mockClear();
    mockHttpPost.mockReset();
    explainCache.clear();
    mockLintContext = undefined;
  });

  it('renders static markers first, then re-renders with explain diagnostics merged', async () => {
    mockHttpPost.mockResolvedValue(NOT_PUSHED_PLAN);
    mockLintContext = {
      http: httpClient(),
      isCalcite: true,
      dataSourceVersion: '3.5.0',
      dataSourceId: 'ds-1',
      overrides: ENABLE_NOT_PUSHED,
    } as any;

    await revalidatePPLModel(makeModel('e1'));
    await flush();

    const calls = lintMarkerCalls();
    // Two renders: the fast static pass, then the explain re-render.
    expect(calls.length).toBe(2);
    // First render: only the static rule.
    expect(calls[0][2].map((m: any) => m.code)).toEqual(['head-without-sort']);
    // Second render: static + explain, static first.
    expect(calls[1][2].map((m: any) => m.code)).toEqual([
      'head-without-sort',
      'operation-not-pushed',
    ]);
    // The explain marker is NARROWED to the `where age > 30` predicate, not the
    // whole query: a single candidate resolves without any probe request.
    const explainMarker = calls[1][2].find((m: any) => m.code === 'operation-not-pushed');
    const query = 'source=logs | where age > 30';
    expect(explainMarker.range.startColumn).toBeGreaterThan(0);
    expect(query.slice(explainMarker.range.startColumn, explainMarker.range.endColumn)).toBe(
      'age > 30'
    );
    expect(mockHttpPost).toHaveBeenCalledTimes(1);
    expect(mockHttpPost.mock.calls[0][0]).toBe('/api/enhancements/ppl/explain');
  });

  it('issues no explain request when no explain rule is enabled', async () => {
    mockLintContext = {
      http: httpClient(),
      isCalcite: true,
      dataSourceVersion: '3.5.0',
      // Both explain rules ship enabled, so disable them explicitly to exercise
      // the no-network path.
      overrides: DISABLE_EXPLAIN,
    } as any;

    await revalidatePPLModel(makeModel('e2'));
    await flush();

    expect(mockHttpPost).not.toHaveBeenCalled();
    // Only the static render happened.
    expect(lintMarkerCalls().length).toBe(1);
  });

  it('issues no explain request when there is no http client', async () => {
    mockLintContext = {
      isCalcite: true,
      dataSourceVersion: '3.5.0',
      overrides: ENABLE_NOT_PUSHED,
    } as any;

    await revalidatePPLModel(makeModel('e3'));
    await flush();

    expect(mockHttpPost).not.toHaveBeenCalled();
    expect(lintMarkerCalls().length).toBe(1);
  });

  it('leaves static markers untouched when the cluster is not Calcite (empty plan)', async () => {
    // A non-Calcite / v2 response shape → toExplainPlan yields isCalcite:false →
    // resolution 'unsupported' → no re-render. This is the no-clean-parse-guard
    // safety: an unusable plan simply produces nothing.
    mockHttpPost.mockResolvedValue({ root: { children: [] } });
    mockLintContext = {
      http: httpClient(),
      isCalcite: true,
      dataSourceVersion: '3.5.0',
      overrides: ENABLE_NOT_PUSHED,
    } as any;

    await revalidatePPLModel(makeModel('e4'));
    await flush();

    // The round-trip fired, but produced no second render.
    expect(mockHttpPost).toHaveBeenCalledTimes(1);
    expect(lintMarkerCalls().length).toBe(1);
    expect(lintMarkerCalls()[0][2].map((m: any) => m.code)).toEqual(['head-without-sort']);
  });

  it('fast mode drops an ambiguous multi-candidate finding (no probes)', async () => {
    // Two `where` clauses both flagged → the resolver cannot attribute the
    // whole-query finding to one command; fast mode issues no probe and shows no
    // explain marker (only the baseline `_explain` request fires).
    mockHttpPost.mockResolvedValue(NOT_PUSHED_PLAN);
    mockLintContext = {
      http: httpClient(),
      isCalcite: true,
      dataSourceVersion: '3.5.0',
      dataSourceId: 'ds-fast',
      overrides: ENABLE_NOT_PUSHED,
      explainMode: 'fast',
    } as any;

    await revalidatePPLModel(makeModel('e6', 'source=logs | where age > 30 | where bytes > 5'));
    await flush();

    // The last render drops the ambiguous finding: no operation-not-pushed
    // marker, and exactly one (baseline) http call — probes never fired.
    const last = lintMarkerCalls().slice(-1)[0];
    expect(last[2].map((m: any) => m.code)).toEqual(['head-without-sort']);
    expect(mockHttpPost).toHaveBeenCalledTimes(1);
  });

  it('thorough mode probes an ambiguous finding and narrows to the culprit', async () => {
    // Two `where` clauses; only `bytes > 5` reproduces the outcome under probing.
    // The probe set neutralizes non-culprit predicates to `true`, so only a
    // query still carrying `bytes > 5` reproduces the coordinator-filter plan.
    const query = 'source=logs | where age > 30 | where bytes > 5';
    mockHttpPost.mockImplementation(async (_path: string, req: { body?: BodyInit | null }) => {
      const q = JSON.parse(String(req.body)).query as string;
      return q.includes('bytes > 5')
        ? NOT_PUSHED_PLAN
        : { calcite: { physical: { rels: [{ id: '1', relOp: 'CalciteEnumerableIndexScan' }] } } };
    });
    mockLintContext = {
      http: httpClient(),
      isCalcite: true,
      dataSourceVersion: '3.5.0',
      dataSourceId: 'ds-thorough',
      overrides: ENABLE_NOT_PUSHED,
      explainMode: 'thorough',
    } as any;

    await revalidatePPLModel(makeModel('e7', query));
    await flush();

    const last = lintMarkerCalls().slice(-1)[0];
    const explainMarker = last[2].find((m: any) => m.code === 'operation-not-pushed');
    expect(explainMarker).toBeDefined();
    expect(query.slice(explainMarker.range.startColumn, explainMarker.range.endColumn)).toBe(
      'bytes > 5'
    );
    // More than the single baseline request fired: control + treatment probes ran.
    expect(mockHttpPost.mock.calls.length).toBeGreaterThan(1);
  });

  it('drops the explain re-render when the model was edited mid-flight', async () => {
    let resolvePlan!: (p: unknown) => void;
    mockHttpPost.mockReturnValue(new Promise((r) => (resolvePlan = r)));
    mockLintContext = {
      http: httpClient(),
      isCalcite: true,
      dataSourceVersion: '3.5.0',
      overrides: ENABLE_NOT_PUSHED,
    } as any;

    const model = makeModel('e5', 'source=logs | where age > 30');
    // Mutate the model value so the post-explain staleness check (getValue !==
    // content captured at pass start) trips.
    let currentValue = 'source=logs | where age > 30';
    model.getValue = () => currentValue;

    await revalidatePPLModel(model);
    await flush();
    // Static render happened; explain request is in-flight.
    expect(lintMarkerCalls().length).toBe(1);

    currentValue = 'source=logs | where age > 40'; // user edited
    resolvePlan(NOT_PUSHED_PLAN);
    await flush();

    // No second render: the stale explain response was dropped.
    expect(lintMarkerCalls().length).toBe(1);
  });
});
