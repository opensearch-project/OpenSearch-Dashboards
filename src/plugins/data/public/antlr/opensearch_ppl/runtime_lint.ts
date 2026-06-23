/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { LintResult, PPLLintContext, PPLLintBridgeRequest, LintRunContext } from '@osd/monaco';
// Deep imports avoid the barrel (which pulls in Monaco ESM and is jest.mock()'d in tests).
import { runLint } from '@osd/monaco/target/ppl/lint/lint_runner';
import { createRuntimeRuleNameToIndex } from '@osd/monaco/target/ppl/lint/rule_index';
import { PIPE_FIRST_PREFIX, remapPipeFirstColumns } from '@osd/monaco/target/ppl/lint/range_utils';
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

function buildRuntimeTree(query: string, grammar: CachedGrammar): ParserRuleContext | undefined {
  const isPipeFirst = query.trimStart().startsWith('|');
  const effective = isPipeFirst ? PIPE_FIRST_PREFIX + query : query;

  const spaceToken = resolveSpaceToken(grammar);
  const startRuleIndex = isPipeFirst
    ? grammar.startRuleIndex ?? 0
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
  // Unlike validation (buildParseTrees=false), the linter needs the tree.
  parser.buildParseTrees = true;

  try {
    const tree = parser.parse(startRuleIndex);
    if (errorListener.errors.length > 0) {
      return undefined;
    }
    return tree ?? undefined;
  } catch {
    return undefined;
  }
}

function lintWithGrammar(
  query: string,
  grammar: CachedGrammar,
  context: PPLLintContext | undefined
): LintResult {
  if (!query.trim()) {
    return { diagnostics: [] };
  }

  const tree = buildRuntimeTree(query, grammar);
  if (!tree) {
    return { diagnostics: [] };
  }

  const diagnostics = runLint(tree, {
    ruleNameToIndex: createRuntimeRuleNameToIndex(grammar.runtimeRuleNameToIndex),
    dataSourceVersion: context?.dataSourceVersion,
    context: {
      ...(context as LintRunContext),
      grammarSurface: 'runtime-bundle',
      grammarHash: grammar.grammarHash,
    },
  });

  // Subtract the synthetic prefix width so squiggles align with the user's text.
  const isPipeFirst = query.trimStart().startsWith('|');
  return { diagnostics: isPipeFirst ? remapPipeFirstColumns(diagnostics) : diagnostics };
}

/** Runtime lint bridge; returns null on cache miss or disabled flag, triggering the compiled fallback. */
export async function lintRuntimePPLQuery(
  request: PPLLintBridgeRequest
): Promise<LintResult | null> {
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
