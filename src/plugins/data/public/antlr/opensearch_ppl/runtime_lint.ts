/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Both values and types come from the Monaco-free `@osd/monaco/ppl-lint`
// subpath (a redirect-stub dir). It exposes only the engine, so it neither
// pulls in Monaco ESM (which is jest.mock()'d in tests) nor couples this file
// to the `@osd/monaco/target/...` build layout.
import type { LintResult, LintRunContext } from '@osd/monaco/ppl-lint';
import {
  runLint,
  createRuntimeRuleNameToIndex,
  PIPE_FIRST_PREFIX,
  remapPipeFirstColumns,
} from '@osd/monaco/ppl-lint';
import {
  CharStream,
  CommonTokenStream,
  LexerInterpreter,
  ParserInterpreter,
  ParserRuleContext,
} from 'antlr4ng';
import { GeneralErrorListener } from '../shared/general_error_listerner';
import { CachedGrammar, pplGrammarCache } from './ppl_grammar_cache';
import { pickStartRuleIndex, resolveSpaceToken } from './runtime_grammar_utils';

/**
 * The lint context this runtime fallback reads. Mirrors `@osd/monaco`'s
 * PPLLintContext minus the Monaco-only pieces (e.g. the http client), so this
 * file needs nothing from the Monaco-laden `@osd/monaco` barrel.
 */
type RuntimeLintContext = LintRunContext & { useRuntimeGrammar?: boolean };

/**
 * The subset of `@osd/monaco`'s PPLLintBridgeRequest this fallback consumes.
 * The full bridge request also carries a `monaco.editor.IModel`, which this
 * runtime path never reads — so we narrow to a Monaco-free shape.
 */
interface RuntimeLintRequest {
  content: string;
  context?: RuntimeLintContext;
}

function buildRuntimeTree(query: string, grammar: CachedGrammar): ParserRuleContext | undefined {
  const isPipeFirst = query.trimStart().startsWith('|');
  const effective = isPipeFirst ? PIPE_FIRST_PREFIX + query : query;

  const spaceToken = resolveSpaceToken(grammar);
  const startRuleIndex = isPipeFirst
    ? (grammar.startRuleIndex ?? 0)
    : pickStartRuleIndex(query, grammar);
  const errorListener = new GeneralErrorListener(spaceToken);

  const lexer = new LexerInterpreter(
    'PPL',
    grammar.vocabulary,
    grammar.lexerRuleNames,
    grammar.channelNames,
    grammar.modeNames,
    grammar.lexerATN,
    CharStream.fromString(effective)
  );
  lexer.removeErrorListeners();
  lexer.addErrorListener(errorListener);

  const tokenStream = new CommonTokenStream(lexer);
  tokenStream.fill();

  const parser = new ParserInterpreter(
    'PPL',
    grammar.vocabulary,
    grammar.parserRuleNames,
    grammar.parserATN,
    tokenStream
  );
  parser.removeErrorListeners();
  parser.addErrorListener(errorListener);
  parser.buildParseTrees = true;

  try {
    // Keep the tree even when the parse had errors. ANTLR's error recovery still
    // produces a usable (partial) tree, and the lint rules are written to walk it
    // best-effort — a semantically-valid query the runtime ATN can't fully parse
    // (e.g. `eval x = <field> + 1`, which the engine accepts) must still be
    // field-validated. This mirrors the compiled fallback path, which runs the
    // rules unconditionally on whatever `root()` returns. Only a thrown exception
    // (no tree at all) suppresses linting.
    const tree = parser.parse(startRuleIndex);
    return tree ?? undefined;
  } catch {
    return undefined;
  }
}

function lintWithGrammar(
  query: string,
  grammar: CachedGrammar,
  context: RuntimeLintContext | undefined
): LintResult {
  if (!query.trim()) {
    return { diagnostics: [] };
  }

  const tree = buildRuntimeTree(query, grammar);
  if (!tree) {
    return { diagnostics: [] };
  }

  const isPipeFirst = query.trimStart().startsWith('|');

  const diagnostics = runLint(tree, {
    ruleNameToIndex: createRuntimeRuleNameToIndex(grammar.runtimeRuleNameToIndex),
    dataSourceVersion: context?.dataSourceVersion,
    context: {
      ...context,
      grammarSurface: 'runtime-bundle',
      grammarHash: grammar.grammarHash,
      isPipeFirst,
    },
  });

  return { diagnostics: isPipeFirst ? remapPipeFirstColumns(diagnostics) : diagnostics };
}

/** Returns null when runtime grammar is unavailable, triggering the compiled fallback. */
export async function lintRuntimePPLQuery(request: RuntimeLintRequest): Promise<LintResult | null> {
  const { content, context } = request;
  if (!context?.useRuntimeGrammar) {
    return null;
  }

  const grammar = pplGrammarCache.getCachedGrammar(context.dataSourceId);
  if (!grammar) {
    return null;
  }

  return lintWithGrammar(content, grammar, context);
}
