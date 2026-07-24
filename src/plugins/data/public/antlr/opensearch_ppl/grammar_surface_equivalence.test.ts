/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ATN,
  ATNDeserializer,
  CharStream,
  CommonTokenStream,
  LexerInterpreter,
  ParserInterpreter,
  ParserRuleContext,
  Vocabulary,
} from 'antlr4ng';
import { SimplifiedOpenSearchPPLLexer, SimplifiedOpenSearchPPLParser } from '@osd/antlr-grammar';
// Importing the engine barrel also registers the bundled detectors as a side
// effect (same module the runtime fallback uses), so runLint resolves them.
import { runLint, createRuntimeRuleNameToIndex } from '@osd/monaco/ppl-lint';
import type { LintRunContext } from '@osd/monaco/ppl-lint';
import engineBundle from './__fixtures__/engine_ppl_grammar_bundle.json';

// Cross-surface equivalence guard for the metadata lint rules (review on #12394).
//
// agg-on-text, flat-object-subfield and type-mismatch-numeric are NOT
// runtimeOnly, so they run on whichever grammar produced the tree:
//   - the backend-fetched RUNTIME ATN when the grammar cache is warm, or
//   - the COMPILED-SIMPLIFIED bundled grammar otherwise (the lint bridge falls
//     back to the analyzer when getCachedGrammar returns null — the initial
//     fetch window and the ~30s cooldown after a failed fetch).
// Which one runs is a timing/network artifact invisible to the user, so a given
// query MUST lint identically on both. The rules resolve node names
// (statsFunction/functionArgs/fieldExpression/comparisonOperator/qualifiedName/
// …) against whichever grammar is active; if those names or the tree shape
// diverge, the same query would lint differently depending only on whether the
// grammar fetch had completed.
//
// The runtime ATN is the engine's OpenSearchPPLParser.g4 (served from
// /_plugins/_ppl/_grammar). `engine_ppl_grammar_bundle.json` is a real bundle
// captured from a live OpenSearch 3.8 cluster (see grammarHash), deserialized
// here through the same ATN path production uses. The simplified side parses
// with the bundled SimplifiedOpenSearchPPLParser. Both feed the SAME runLint +
// bundled detectors — only the grammar/tree differs.
//
// NOTE: the vendored `@osd/antlr-grammar` full `OpenSearchPPLParser` is a
// DIFFERENT (older, ~114-rule) grammar than the engine serves (~259 rules) and
// is on no live lint path, so it is deliberately NOT used as the runtime proxy.

const ATN_DESERIALIZE_OPTIONS = {
  readOnly: false,
  verifyATN: true,
  generateRuleBypassTransitions: true,
};

function ruleNameToIndexMap(parserRuleNames: string[]): Map<string, number> {
  const map = new Map<string, number>();
  parserRuleNames.forEach((name, i) => map.set(name, i));
  return map;
}

// --- Runtime (engine ATN) tree, built the way runtime_lint.buildRuntimeTree does ---
const engine = engineBundle as any;
const engineLexerATN: ATN = new ATNDeserializer(ATN_DESERIALIZE_OPTIONS).deserialize(
  engine.lexerSerializedATN
);
const engineParserATN: ATN = new ATNDeserializer(ATN_DESERIALIZE_OPTIONS).deserialize(
  engine.parserSerializedATN
);
const engineVocab = new Vocabulary(engine.literalNames, engine.symbolicNames, []);
const engineRni = createRuntimeRuleNameToIndex(ruleNameToIndexMap(engine.parserRuleNames));

function engineTree(query: string): ParserRuleContext {
  const lexer = new LexerInterpreter(
    'PPL',
    engineVocab,
    engine.lexerRuleNames,
    engine.channelNames,
    engine.modeNames,
    engineLexerATN,
    CharStream.fromString(query)
  );
  lexer.removeErrorListeners();
  const tokenStream = new CommonTokenStream(lexer);
  tokenStream.fill();
  const parser = new ParserInterpreter(
    'PPL',
    engineVocab,
    engine.parserRuleNames,
    engineParserATN,
    tokenStream
  );
  parser.removeErrorListeners();
  parser.buildParseTrees = true;
  return parser.parse(engine.startRuleIndex) as ParserRuleContext;
}

// --- Compiled-simplified tree, the fallback surface ---
const simpRni = createRuntimeRuleNameToIndex(
  ruleNameToIndexMap(SimplifiedOpenSearchPPLParser.ruleNames)
);

function simplifiedTree(query: string): ParserRuleContext {
  const lexer = new SimplifiedOpenSearchPPLLexer(CharStream.fromString(query));
  lexer.removeErrorListeners();
  const parser = new SimplifiedOpenSearchPPLParser(new CommonTokenStream(lexer));
  parser.removeErrorListeners();
  return parser.root();
}

const context: LintRunContext = {
  isCalcite: true,
  dataSourceVersion: '3.8.0',
  fields: new Set<string>(['note', 'qty', 'balance', 'attributes', 'attributes.http']),
  typeMap: new Map<string, string>([
    ['note', 'text'],
    ['qty', 'long'],
    ['balance', 'long'],
    ['attributes', 'flat_object'],
    ['attributes.http', 'keyword'],
  ]),
};

const METADATA_RULES = new Set(['agg-on-text', 'flat-object-subfield', 'type-mismatch-numeric']);

function shape(tree: ParserRuleContext, rni: ReturnType<typeof createRuntimeRuleNameToIndex>) {
  return runLint(tree, { ruleNameToIndex: rni, dataSourceVersion: '3.8.0', context })
    .filter((d) => METADATA_RULES.has(d.ruleId))
    .map((d) => `${d.ruleId}@${d.range.startColumn}-${d.range.endColumn}`)
    .sort();
}

describe('metadata rules — runtime (engine ATN) vs compiled-simplified equivalence', () => {
  it('the captured engine bundle is the expected 3.8 grammar (fixture sanity)', () => {
    expect(engine.grammarHash).toMatch(/^sha256:/);
    expect(engine.parserRuleNames).toContain('functionArgs');
    expect(engine.parserRuleNames).toContain('statsFunction');
    expect(engine.parserRuleNames.length).toBeGreaterThan(200);
    // Guard against silently comparing simplified-against-simplified: the engine
    // grammar is materially larger than the bundled simplified one.
    expect(engine.parserRuleNames.length).toBeGreaterThan(
      SimplifiedOpenSearchPPLParser.ruleNames.length
    );
  });

  const QUERIES: Array<{ q: string; expect: string[] }> = [
    { q: 'source=t | stats avg(note)', expect: ['agg-on-text'] },
    { q: 'source=t | stats sum(qty)', expect: [] },
    { q: 'source=t | stats avg(qty)', expect: [] },
    { q: 'source=t | stats count(note)', expect: [] },
    { q: 'source=t | stats avg(balance / 2)', expect: [] },
    { q: 'source=t | fields attributes', expect: ['flat-object-subfield'] },
    { q: 'source=t | fields attributes.other', expect: ['flat-object-subfield'] },
    { q: 'source=t | fields attributes.http', expect: [] },
    { q: 'source=t | where qty = "many"', expect: ['type-mismatch-numeric'] },
    { q: 'source=t | where qty = "32"', expect: [] },
    { q: 'source=t | where note = "x"', expect: [] },
    { q: 'source=t | where attributes = 1', expect: ['flat-object-subfield'] },
  ];

  for (const { q, expect: expected } of QUERIES) {
    it(`lints identically on both surfaces: "${q}"`, () => {
      const runtime = shape(engineTree(q), engineRni);
      const simplified = shape(simplifiedTree(q), simpRni);

      // 1) The two surfaces agree with each other (the property under review).
      expect(runtime).toEqual(simplified);

      // 2) …and with the intended behavior (guards against both being wrong).
      const firedRules = [...new Set(runtime.map((d) => d.split('@')[0]))].sort();
      expect(firedRules).toEqual([...expected].sort());
    });
  }
});
