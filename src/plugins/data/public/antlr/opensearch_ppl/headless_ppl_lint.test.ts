/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
import { PPLGrammarBundle } from './ppl_bundle_loader';

// Capture the options `runLint` is invoked with so we can prove the headless API
// stamps `grammarSurface: 'runtime-bundle'` and forwards `knownVersion` — the
// anti-vacuous guard: without that surface flag, `runtimeOnly` arity rules
// (multisearch/union/replace) silently never fire and CI would pass vacuously.
// The `@osd/monaco/ppl-lint` named exports are read-only (esModuleInterop), so a
// module-factory wrapper is used instead of `jest.spyOn`.
const runLintCalls: Array<{ knownVersion?: string; context?: Record<string, unknown> }> = [];
jest.mock('@osd/monaco/ppl-lint', () => {
  const actual = jest.requireActual('@osd/monaco/ppl-lint');
  return {
    ...actual,
    runLint: jest.fn((tree: unknown, options: { knownVersion?: string; context?: object }) => {
      runLintCalls.push(options);
      return actual.runLint(tree, options);
    }),
  };
});

// Imported below the mock on purpose: the factory above must be registered
// before the module under test pulls in `@osd/monaco/ppl-lint`.
import {
  deserializeGrammarBundle,
  deserializeBundleOrThrow,
  lintQueryWithBundle,
} from './headless_ppl_lint';

/**
 * Build a real PPL grammar bundle — a serialized ATN plus vocabulary/rule
 * arrays, exactly the shape `GET /_plugins/_ppl/_grammar` produces — from the
 * checked-in simplified grammar. This exercises the production
 * `deserializeGrammarBundle` (shape validation + ATN deserialization) end to
 * end rather than hand-assembling a `CachedGrammar`, so the test proves the CI
 * runner's `bundle JSON -> parse tree -> diagnostics` path.
 */
function buildSimplifiedBundle(overrides: Partial<PPLGrammarBundle> = {}): PPLGrammarBundle {
  const lexer = SimplifiedOpenSearchPPLLexer as unknown as {
    _serializedATN: number[];
    ruleNames: string[];
    channelNames: string[];
    modeNames: string[];
  };
  const parser = SimplifiedOpenSearchPPLParser as unknown as {
    _serializedATN: number[];
    ruleNames: string[];
    literalNames: Array<string | null>;
    symbolicNames: Array<string | null>;
  };

  return {
    bundleVersion: '1.0',
    grammarHash: 'sha256:headless-test-grammar',
    startRuleIndex: Math.max(0, parser.ruleNames.indexOf('root')),
    pipeStartRuleIndex: parser.ruleNames.indexOf('commands'),
    lexerSerializedATN: Array.from(lexer._serializedATN),
    parserSerializedATN: Array.from(parser._serializedATN),
    lexerRuleNames: lexer.ruleNames,
    parserRuleNames: parser.ruleNames,
    channelNames: lexer.channelNames,
    modeNames: lexer.modeNames,
    literalNames: parser.literalNames,
    symbolicNames: parser.symbolicNames,
    ...overrides,
  };
}

describe('deserializeGrammarBundle', () => {
  it('deserializes a well-formed bundle into a usable CachedGrammar', () => {
    const grammar = deserializeGrammarBundle(buildSimplifiedBundle());
    expect(grammar).not.toBeNull();
    expect(grammar!.grammarHash).toBe('sha256:headless-test-grammar');
    // The runtime rule-name map is what the detectors index rules through.
    expect(grammar!.runtimeRuleNameToIndex.get('eventstatsCommand')).toBeGreaterThanOrEqual(0);
    // Symbolic-name -> token-type map skips index 0 (EOF/invalid).
    expect(grammar!.runtimeSymbolicNameToTokenType.size).toBeGreaterThan(0);
  });

  it('returns null for a malformed bundle (missing serialized ATN)', () => {
    const bundle = buildSimplifiedBundle();
    // @ts-expect-error deliberately corrupt the shape
    delete bundle.parserSerializedATN;
    expect(deserializeGrammarBundle(bundle)).toBeNull();
  });

  it('returns null for a non-object bundle', () => {
    expect(deserializeGrammarBundle(null)).toBeNull();
    expect(deserializeGrammarBundle('not a bundle')).toBeNull();
  });
});

describe('deserializeBundleOrThrow', () => {
  it('returns a CachedGrammar for a valid bundle', () => {
    expect(deserializeBundleOrThrow(buildSimplifiedBundle()).grammarHash).toBe(
      'sha256:headless-test-grammar'
    );
  });

  it('throws loudly on an invalid bundle rather than returning null', () => {
    // CI has no compiled fallback: a silent empty grammar would let a real
    // regression pass vacuously, so the CI-facing entry point must throw.
    expect(() => deserializeBundleOrThrow({})).toThrow(/failed to deserialize/i);
  });
});

describe('lintQueryWithBundle', () => {
  beforeEach(() => {
    runLintCalls.length = 0;
  });

  const grammar = () => deserializeBundleOrThrow(buildSimplifiedBundle());

  it('emits one error for the eventstats trigger query', () => {
    const result = lintQueryWithBundle(
      'source=accounts | eventstats rank() as rank_value',
      grammar(),
      { dataSourceVersion: '3.8.0', isCalcite: true }
    );
    const eventstats = result.diagnostics.filter(
      (d) => d.ruleId === 'unsupported-window-function-in-eventstats'
    );
    expect(eventstats).toHaveLength(1);
    expect(eventstats[0].severity).toBe('error');
  });

  it('emits no diagnostic for the eventstats control query', () => {
    const result = lintQueryWithBundle(
      'source=accounts | eventstats avg(age) as avg_age',
      grammar(),
      { dataSourceVersion: '3.8.0', isCalcite: true }
    );
    expect(
      result.diagnostics.filter((d) => d.ruleId === 'unsupported-window-function-in-eventstats')
    ).toHaveLength(0);
  });

  it('returns an empty result for a blank query without invoking the detectors', () => {
    const result = lintQueryWithBundle('   ', grammar());
    expect(result.diagnostics).toEqual([]);
    expect(runLintCalls).toHaveLength(0);
  });

  it('remaps pipe-first diagnostic ranges back to source columns', () => {
    // head-without-sort is an always-on info rule; a pipe-first query exercises
    // the synthetic-prefix column remap shared with the browser path.
    const result = lintQueryWithBundle('| head 10', grammar());
    const head = result.diagnostics.find((d) => d.ruleId === 'head-without-sort');
    expect(head).toBeDefined();
    expect(head!.range.startLine).toBe(1);
    expect(head!.range.startColumn).toBe(2);
  });

  describe('anti-vacuous surface + version forwarding', () => {
    it('stamps grammarSurface "runtime-bundle" so runtimeOnly rules are not skipped', () => {
      lintQueryWithBundle('source=accounts | head 10', grammar(), { dataSourceVersion: '3.8.0' });
      expect(runLintCalls.length).toBeGreaterThan(0);
      expect(runLintCalls[0].context?.grammarSurface).toBe('runtime-bundle');
      expect(runLintCalls[0].context?.grammarHash).toBe('sha256:headless-test-grammar');
    });

    it('forwards knownVersion to the version filter when supplied', () => {
      lintQueryWithBundle('source=accounts | head 10', grammar(), {
        dataSourceVersion: '3.8.0',
        knownVersion: '3.8.0',
      });
      expect(runLintCalls[0].knownVersion).toBe('3.8.0');
    });

    it('leaves knownVersion undefined (engine default) when not supplied', () => {
      lintQueryWithBundle('source=accounts | head 10', grammar(), { dataSourceVersion: '3.8.0' });
      expect(runLintCalls[0].knownVersion).toBeUndefined();
    });

    it('forwards field/context data into the lint run', () => {
      lintQueryWithBundle('source=accounts | head 10', grammar(), {
        dataSourceVersion: '3.8.0',
        isCalcite: true,
        fields: new Set(['age', 'balance']),
        visibleIndices: ['accounts'],
      });
      expect(runLintCalls[0].context?.isCalcite).toBe(true);
      expect((runLintCalls[0].context?.fields as Set<string>)?.has('age')).toBe(true);
      expect(runLintCalls[0].context?.visibleIndices).toEqual(['accounts']);
    });
  });
});
