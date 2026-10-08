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
// effect, so runLint resolves them.
import { runLint, createRuntimeRuleNameToIndex, buildPipelineShape } from '@osd/monaco/ppl-lint';
import type { LintRunContext } from '@osd/monaco/ppl-lint';
import engineBundle from './__fixtures__/engine_ppl_grammar_bundle.json';

// Behavioural cover for the command order classification (review on #12394).
//
// Two defects motivate this. The engine merged `topCommand`/`rareCommand` into
// `rareTopCommand`, and 16 further engine commands were never in the lint model
// at all. Since stage lookup is by name, both showed up as SILENT gaps: an
// unknown stage is skipped, so head-without-sort treats it as order-preserving
// and — the more damaging half — the fields it creates are never registered, so
// field-validation reports a valid reference as an unknown field at ERROR
// severity.
//
// Every ordering expectation below was read off `_explain` on a live 3.8 cluster:
// a surviving top-level `sort0` means order carried through, a new top-level sort
// means the command established one, and an aggregate/union that swallows the
// sort means order is gone.

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
  overrides: { 'head-without-sort': { enabled: true } },
};

function firesHeadWithoutSort(tree: ParserRuleContext, rni: any): boolean {
  return runLint(tree, { ruleNameToIndex: rni, context }).some(
    (d) => d.ruleId === 'head-without-sort'
  );
}

function stagesOf(tree: ParserRuleContext, rni: any): string[] {
  return buildPipelineShape(tree, rni).stages.map((stage: { command: string }) => stage.command);
}

describe('head-without-sort respects the command order classification', () => {
  // `stage` is asserted separately so a coincidentally-correct diagnostic cannot
  // hide a stage that is still invisible to the pipeline model.
  const RUNTIME_CASES: Array<{ query: string; fires: boolean; stage: string; why: string }> = [
    {
      query: 'source=t | sort age | top 5 gender | head 5',
      fires: false,
      stage: 'rareTopCommand',
      why: 'top ranks by count with a deterministic tie-break, so it establishes an order',
    },
    {
      query: 'source=t | sort age | rare 5 gender | head 5',
      fires: false,
      stage: 'rareTopCommand',
      why: 'rare is the same grammar rule as top from 3.6 on',
    },
    {
      query: 'source=t | sort age | chart count() by gender | head 5',
      fires: false,
      stage: 'chartCommand',
      why: 'chart emits a top-level sort on the row-split key',
    },
    {
      query: 'source=t | sort age | transpose | head 5',
      fires: true,
      stage: 'transposeCommand',
      why: 'transpose pivots, so output rows are input columns and row order is gone',
    },
    {
      query: 'source=t | sort age | mvexpand gender | head 5',
      fires: false,
      stage: 'mvexpandCommand',
      why: 'expansion keeps copies grouped with their source row, so the sort holds',
    },
    {
      query: 'source=t | sort age | mvcombine gender | head 5',
      fires: true,
      stage: 'mvcombineCommand',
      why: 'mvcombine aggregates into arrays and the sort is swallowed',
    },
    {
      query: 'source=t | sort age | convert num(age) as n | head 5',
      fires: false,
      stage: 'convertCommand',
      why: 'convert reformats a column in place',
    },
    {
      query: 'source=t | sort age | addtotals | head 5',
      fires: false,
      stage: 'addtotalsCommand',
      why: 'addtotals appends a per-row total column, no union',
    },
    {
      query: 'source=t | sort age | timewrap 1d | head 5',
      fires: true,
      stage: 'timewrapCommand',
      why: 'timewrap re-sorts by span and series',
    },
  ];

  it.each(RUNTIME_CASES)('runtime grammar: $why', ({ query, fires, stage }) => {
    const tree = engineTree(query);
    expect(stagesOf(tree, engineRni)).toContain(stage);
    expect(firesHeadWithoutSort(tree, engineRni)).toBe(fires);
  });

  it('bundled grammar: top/rare establish an order under their split rule names', () => {
    for (const query of [
      'source=t | sort age | top 5 gender | head 5',
      'source=t | sort age | rare 5 gender | head 5',
    ]) {
      const tree = simplifiedTree(query);
      expect(firesHeadWithoutSort(tree, simpRni)).toBe(false);
    }
    expect(stagesOf(simplifiedTree('source=t | top 5 gender | head 5'), simpRni)).toContain(
      'topCommand'
    );
  });

  it('timechart establishes a time order on both surfaces', () => {
    // Previously fired on both: timechart was a known stage but was not treated
    // as ordering, so `timechart | head` looked unordered when it is not.
    const query = 'source=t | timechart count() | head 5';
    expect(firesHeadWithoutSort(engineTree(query), engineRni)).toBe(false);
    expect(firesHeadWithoutSort(simplifiedTree(query), simpRni)).toBe(false);
  });

  it('trendline preserves the incoming order on both surfaces', () => {
    const query = 'source=t | sort age | trendline sma(2, age) as t | head 5';
    expect(firesHeadWithoutSort(engineTree(query), engineRni)).toBe(false);
    expect(firesHeadWithoutSort(simplifiedTree(query), simpRni)).toBe(false);
  });

  it('still fires for genuinely order-destroying and missing-sort cases', () => {
    // Controls: the rule must keep working, on both surfaces.
    for (const [query, fires] of [
      ['source=t | sort age | stats count() by gender | head 5', true],
      ['source=t | head 5', true],
      ['source=t | sort age | head 5', false],
      ['source=t | sort age | eval x = 1 | head 5', false],
    ] as Array<[string, boolean]>) {
      expect(firesHeadWithoutSort(engineTree(query), engineRni)).toBe(fires);
      expect(firesHeadWithoutSort(simplifiedTree(query), simpRni)).toBe(fires);
    }
  });

  it('does not let a sort inside an appendpipe sub-pipeline suppress an outer head', () => {
    // The bracketed pipeline is independent of the main one, so its sort must not
    // count for the outer head — the same rule appendcol already followed.
    const tree = engineTree('source=t | appendpipe [ sort age ] | head 5');
    expect(stagesOf(tree, engineRni)).toContain('appendPipeCommand');
    expect(firesHeadWithoutSort(tree, engineRni)).toBe(true);
  });
});

describe('field-validation sees fields created by previously-invisible commands', () => {
  // The user-visible half of the same defect: an unknown stage never reaches
  // collectCreatedFields, so a field it creates was reported as unknown at ERROR
  // severity. All four queries are valid on a live 3.8 cluster.
  const fieldContext: LintRunContext = {
    ...context,
    fields: new Set<string>(['account_number', 'age', 'gender']),
    typeMap: new Map<string, string>([
      ['account_number', 'long'],
      ['age', 'long'],
      ['gender', 'keyword'],
    ]),
  };

  const CASES: Array<{ query: string; created: string }> = [
    { query: 'source=t | convert num(age) as agenum | fields agenum', created: 'agenum' },
    { query: 'source=t | chart count() as c by gender | where c > 1', created: 'c' },
    { query: 'source=t | addtotals fieldname="tot" | where tot > 1', created: 'tot' },
    { query: 'source=t | addtotals | where Total > 1', created: 'Total' },
    {
      query: 'source=t | graphlookup t start=age edge=gender-->gender as outf | fields outf',
      created: 'outf',
    },
  ];

  it.each(CASES)('registers "$created" so it is not flagged unknown', ({ query, created }) => {
    const tree = engineTree(query);
    expect(buildPipelineShape(tree, engineRni).createdFields).toContain(created);

    const unknownFieldDiagnostics = runLint(tree, {
      ruleNameToIndex: engineRni,
      context: fieldContext,
    }).filter((d) => d.ruleId === 'field-validation' && d.message.includes(created));
    expect(unknownFieldDiagnostics).toEqual([]);
  });
});
