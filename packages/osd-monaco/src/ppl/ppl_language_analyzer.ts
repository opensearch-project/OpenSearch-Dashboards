/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as antlr from 'antlr4ng';
import {
  SimplifiedOpenSearchPPLLexer as OpenSearchPPLLexer,
  SimplifiedOpenSearchPPLParser as OpenSearchPPLParser,
} from '@osd/antlr-grammar';
import { PPLSyntaxErrorListener, SyntaxError } from './ppl_error_listener';
import { LintResult } from './lint/diagnostic';
import { runLint } from './lint/lint_runner';
import { createCompiledRuleNameToIndex } from './lint/rule_index';
import { PIPE_FIRST_PREFIX, remapPipeFirstColumns } from './lint/range_utils';
import { LintRunContext } from './lint/types';

export interface PPLToken {
  type: string;
  value: string;
  startIndex: number;
  stopIndex: number;
  line: number;
  column: number;
}

export interface PPLValidationResult {
  isValid: boolean;
  errors: SyntaxError[];
}

export interface PPLCompletionItem {
  label: string;
  kind: number;
  detail?: string;
  documentation?: string;
  insertText?: string;
}

/**
 * PPL Language Analyzer - provides tokenization, validation, and code completion for PPL queries
 * Uses ANTLR generated lexer and parser for accurate language processing
 */
export class PPLLanguageAnalyzer {
  private createLexerAndTokenStream(
    code: string
  ): { lexer: OpenSearchPPLLexer; tokenStream: antlr.CommonTokenStream } {
    const inputStream = antlr.CharStream.fromString(code);
    const lexer = new OpenSearchPPLLexer(inputStream);
    const tokenStream = new antlr.CommonTokenStream(lexer);
    return { lexer, tokenStream };
  }

  private createParserWithErrorHandling(
    tokenStream: antlr.CommonTokenStream
  ): { parser: OpenSearchPPLParser; parserErrorListener: PPLSyntaxErrorListener } {
    const parser = new OpenSearchPPLParser(tokenStream);
    const parserErrorListener = new PPLSyntaxErrorListener();
    parser.removeErrorListeners();
    parser.addErrorListener(parserErrorListener);
    return { parser, parserErrorListener };
  }

  tokenize(code: string): PPLToken[] {
    const tokens: PPLToken[] = [];

    try {
      const { lexer, tokenStream } = this.createLexerAndTokenStream(code);
      tokenStream.fill();

      const antlrTokens = tokenStream.getTokens();

      for (const token of antlrTokens) {
        if (token.type !== antlr.Token.EOF) {
          const tokenTypeName = this.getTokenTypeName(token.type, lexer);
          tokens.push({
            type: tokenTypeName,
            value: token.text || '',
            startIndex: token.start,
            stopIndex: token.stop,
            line: token.line,
            column: token.column,
          });
        }
      }
    } catch (error) {
      // Silent error handling for tokenization issues
    }

    return tokens;
  }

  validate(code: string): PPLValidationResult {
    try {
      const { lexer, tokenStream } = this.createLexerAndTokenStream(code);

      // Add error listener to lexer
      const lexerErrorListener = new PPLSyntaxErrorListener();
      lexer.removeErrorListeners();
      lexer.addErrorListener(lexerErrorListener);

      const { parser, parserErrorListener } = this.createParserWithErrorHandling(tokenStream);

      parser.root();

      const allErrors = [...lexerErrorListener.errors, ...parserErrorListener.errors];
      return { isValid: allErrors.length === 0, errors: allErrors };
    } catch (error) {
      // Return parsing exception as error
      return {
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
      };
    }
  }

  lint(code: string, context?: LintRunContext): LintResult {
    try {
      const trimmed = code.trimStart();
      const isPipeFirst = trimmed.startsWith('|');
      const effectiveCode = isPipeFirst ? PIPE_FIRST_PREFIX + code : code;

      const { tokenStream } = this.createLexerAndTokenStream(effectiveCode);
      const { parser } = this.createParserWithErrorHandling(tokenStream);
      const tree = parser.root();

      const diagnostics = runLint(tree, {
        ruleNameToIndex: createCompiledRuleNameToIndex(),
        dataSourceVersion: context?.dataSourceVersion,
        context: { ...context, grammarSurface: 'compiled-simplified' },
      });

      if (isPipeFirst) {
        return { diagnostics: remapPipeFirstColumns(diagnostics) };
      }

      return { diagnostics };
    } catch {
      return { diagnostics: [] };
    }
  }

  private getTokenTypeName(tokenType: number, lexer: OpenSearchPPLLexer): string {
    const symbolic = lexer.vocabulary.getSymbolicName(tokenType);
    if (symbolic) return symbolic.toLowerCase();
    const literal = lexer.vocabulary.getLiteralName(tokenType);
    if (literal) return literal.replace(/['"]/g, '');
    return 'unknown';
  }
}

let pplLanguageAnalyzerInstance: PPLLanguageAnalyzer | null = null;

export const getPPLLanguageAnalyzer = (): PPLLanguageAnalyzer => {
  if (!pplLanguageAnalyzerInstance) {
    pplLanguageAnalyzerInstance = new PPLLanguageAnalyzer();
  }
  return pplLanguageAnalyzerInstance;
};
