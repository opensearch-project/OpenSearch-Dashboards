/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { PPLValidationProviderRequest, PPLValidationResult } from '@osd/monaco';
import {
  CharStream,
  CommonTokenStream,
  LexerInterpreter,
  ParserInterpreter,
  Token,
} from 'antlr4ng';
import { GeneralErrorListener } from '../shared/general_error_listerner';
import { CachedGrammar, pplGrammarCache } from './ppl_grammar_cache';

interface PipeStripResult {
  effectiveQuery: string;
  strippedLineCount: number;
  strippedFirstLineLength: number;
}

function tokenTypeBySymbolic(grammar: CachedGrammar, symbolicName: string): number {
  return grammar.runtimeSymbolicNameToTokenType.get(symbolicName) ?? Token.INVALID_TYPE;
}

function resolveSpaceToken(grammar: CachedGrammar): number {
  const dict = grammar.tokenDictionary as Record<string, unknown>;
  const dictionaryValue = dict?.WHITESPACE ?? dict?.SPACE;
  if (typeof dictionaryValue === 'number' && dictionaryValue > Token.INVALID_TYPE) {
    return dictionaryValue;
  }

  const whitespaceToken = tokenTypeBySymbolic(grammar, 'WHITESPACE');
  if (whitespaceToken > Token.INVALID_TYPE) {
    return whitespaceToken;
  }

  const spaceToken = tokenTypeBySymbolic(grammar, 'SPACE');
  if (spaceToken > Token.INVALID_TYPE) {
    return spaceToken;
  }

  const wsToken = tokenTypeBySymbolic(grammar, 'WS');
  if (wsToken > Token.INVALID_TYPE) {
    return wsToken;
  }

  return Token.INVALID_TYPE;
}

function getRuleIndex(grammar: CachedGrammar, ruleName: string): number {
  if (grammar.runtimeRuleNameToIndex?.size) {
    return grammar.runtimeRuleNameToIndex.get(ruleName) ?? -1;
  }
  return grammar.parserRuleNames.indexOf(ruleName);
}

function pickStartRuleIndex(query: string, grammar: CachedGrammar): number {
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

  const subPipelineRule = getRuleIndex(grammar, 'subPipeline');
  if (subPipelineRule >= 0) {
    return subPipelineRule;
  }

  return grammar.startRuleIndex ?? 0;
}

function stripLeadingPipe(query: string): PipeStripResult {
  if (!query.trimStart().startsWith('|')) {
    return {
      effectiveQuery: query,
      strippedLineCount: 0,
      strippedFirstLineLength: 0,
    };
  }

  const pipeIndex = query.indexOf('|');
  const strippedPrefix = query.substring(0, pipeIndex + 1);
  const prefixLines = strippedPrefix.split(/\r\n|\n|\r/);

  return {
    effectiveQuery: query.substring(pipeIndex + 1),
    strippedLineCount: prefixLines.length - 1,
    strippedFirstLineLength: prefixLines[prefixLines.length - 1].length,
  };
}

function remapErrors(result: PPLValidationResult, pipeStrip: PipeStripResult): PPLValidationResult {
  if (pipeStrip.strippedLineCount === 0 && pipeStrip.strippedFirstLineLength === 0) {
    return result;
  }

  return {
    ...result,
    errors: result.errors.map((error) => {
      const line = (error.line ?? 1) + pipeStrip.strippedLineCount;
      const endLine = (error.endLine ?? error.line ?? 1) + pipeStrip.strippedLineCount;
      const columnOffset = (error.line ?? 1) === 1 ? pipeStrip.strippedFirstLineLength : 0;
      const endColumnOffset =
        (error.endLine ?? error.line ?? 1) === 1 ? pipeStrip.strippedFirstLineLength : 0;

      return {
        ...error,
        line,
        endLine,
        column: error.column + columnOffset,
        endColumn: (error.endColumn ?? error.column + 1) + endColumnOffset,
      };
    }),
  };
}

function validateWithGrammar(query: string, grammar: CachedGrammar): PPLValidationResult {
  if (!query.trim()) {
    return { isValid: true, errors: [] };
  }

  const spaceToken = resolveSpaceToken(grammar);
  const startRuleIndex = pickStartRuleIndex(query, grammar);
  const pipeStrip = stripLeadingPipe(query);
  const errorListener = new GeneralErrorListener(spaceToken);

  const lexer = new LexerInterpreter(
    'PPL',
    grammar.vocabulary,
    grammar.lexerRuleNames,
    grammar.channelNames,
    grammar.modeNames,
    grammar.lexerATN,
    CharStream.fromString(pipeStrip.effectiveQuery)
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
  parser.buildParseTrees = false;

  try {
    parser.parse(startRuleIndex);
  } catch (error) {
    if (errorListener.errors.length === 0) {
      return remapErrors(
        {
          isValid: false,
          errors: [
            {
              message: error instanceof Error ? error.message : String(error),
              line: 1,
              column: 0,
              endLine: 1,
              endColumn: 1,
            },
          ],
        },
        pipeStrip
      );
    }
  }

  const result: PPLValidationResult = {
    isValid: errorListener.errors.length === 0,
    errors: errorListener.errors.map((error) => ({
      message: error.message,
      line: error.startLine,
      column: error.startColumn,
      endLine: error.endLine,
      endColumn: error.endColumn,
    })),
  };

  return remapErrors(result, pipeStrip);
}

export function validateRuntimePPLQuery(
  request: PPLValidationProviderRequest
): PPLValidationResult | null {
  const { content, context } = request;
  if (!context?.useRuntimeGrammar) {
    return null;
  }

  const grammar = pplGrammarCache.getCachedGrammar(context.dataSourceId);
  if (!grammar) {
    return null;
  }

  return validateWithGrammar(content, grammar);
}
