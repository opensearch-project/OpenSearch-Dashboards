/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Token } from 'antlr4ng';
import { CachedGrammar } from './ppl_grammar_cache';

export function tokenTypeBySymbolic(grammar: CachedGrammar, symbolicName: string): number {
  return grammar.runtimeSymbolicNameToTokenType.get(symbolicName) ?? Token.INVALID_TYPE;
}

export function getRuleIndex(grammar: CachedGrammar, ruleName: string): number {
  return grammar.runtimeRuleNameToIndex.get(ruleName) ?? -1;
}

export function resolveSpaceToken(grammar: CachedGrammar): number {
  const dictionaryValue = grammar.tokenDictionary.WHITESPACE ?? grammar.tokenDictionary.SPACE;
  if (typeof dictionaryValue === 'number' && dictionaryValue > Token.INVALID_TYPE) {
    return dictionaryValue;
  }
  for (const name of ['WHITESPACE', 'SPACE', 'WS']) {
    const token = tokenTypeBySymbolic(grammar, name);
    if (token > Token.INVALID_TYPE) {
      return token;
    }
  }
  return Token.INVALID_TYPE;
}

/**
 * Pick the start rule for C3/parsing based on query shape.
 * Pipe-first queries (`|...`) use `commands` (or backend-provided pipeStartRuleIndex)
 * so pipeline commands become reachable. Normal queries use the root rule.
 * `commands` is preferred over `subPipeline` because the leading `|` is stripped
 * before lexing, and `commands` expects input after the pipe.
 */
export function pickStartRuleIndex(
  query: string,
  grammar: CachedGrammar,
  includeSubPipelineFallback = false
): number {
  if (!query.trimStart().startsWith('|')) {
    return grammar.startRuleIndex ?? 0;
  }

  if (typeof grammar.pipeStartRuleIndex === 'number' && grammar.pipeStartRuleIndex >= 0) {
    return grammar.pipeStartRuleIndex;
  }

  const commandsRule = getRuleIndex(grammar, 'commands');
  if (commandsRule >= 0) {
    return commandsRule;
  }

  if (includeSubPipelineFallback) {
    const subPipelineRule = getRuleIndex(grammar, 'subPipeline');
    if (subPipelineRule >= 0) {
      return subPipelineRule;
    }
  }

  return grammar.startRuleIndex ?? 0;
}
