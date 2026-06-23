/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Token } from 'antlr4ng';
import { CachedGrammar } from './ppl_grammar_cache';

/** Shared grammar lookups so validation and lint always agree on token/rule resolution. */

export function tokenTypeBySymbolic(grammar: CachedGrammar, symbolicName: string): number {
  return grammar.runtimeSymbolicNameToTokenType.get(symbolicName) ?? Token.INVALID_TYPE;
}

export function getRuleIndex(grammar: CachedGrammar, ruleName: string): number {
  return grammar.runtimeRuleNameToIndex.get(ruleName) ?? -1;
}

/** Resolve the whitespace/space token type, checking the token dictionary first. */
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

/** Pick the parser start rule index. Pipe-first queries try pipeStartRuleIndex → commands → default. */
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
