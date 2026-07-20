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
import { hasExplainRules } from './lint/explain/run_explain_lint';
import { buildExplainAttributionSnapshot } from './lint/explain/attribution/candidates';
import { CompiledPPLLintAnalysis } from './lint/explain/attribution/snapshot';

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
  constructor() {
    // ANTLR-based language analyzer initialization
  }

  /**
   * Creates and configures ANTLR lexer and token stream from input code
   */
  private createLexerAndTokenStream(code: string): {
    lexer: OpenSearchPPLLexer;
    tokenStream: antlr.CommonTokenStream;
  } {
    const inputStream = antlr.CharStream.fromString(code);
    const lexer = new OpenSearchPPLLexer(inputStream);
    const tokenStream = new antlr.CommonTokenStream(lexer);
    return { lexer, tokenStream };
  }

  /**
   * Creates and configures an ANTLR parser with a parser error listener, and —
   * when a lexer is supplied — also attaches a lexer error listener and returns
   * it. The lexer listener lets callers that must decide whether a parse was
   * completely clean (attribution, probe validation) see lexer errors too; the
   * plain `parser.root()` callers can ignore it.
   */
  private createParserWithErrorHandling(
    tokenStream: antlr.CommonTokenStream,
    lexer?: OpenSearchPPLLexer
  ): {
    parser: OpenSearchPPLParser;
    lexerErrorListener: PPLSyntaxErrorListener;
    parserErrorListener: PPLSyntaxErrorListener;
  } {
    const parser = new OpenSearchPPLParser(tokenStream);

    const lexerErrorListener = new PPLSyntaxErrorListener();
    const parserErrorListener = new PPLSyntaxErrorListener();

    if (lexer) {
      lexer.removeErrorListeners();
      lexer.addErrorListener(lexerErrorListener);
    }
    parser.removeErrorListeners();
    parser.addErrorListener(parserErrorListener);

    return { parser, lexerErrorListener, parserErrorListener };
  }

  /**
   * Tokenize PPL code into tokens using ANTLR lexer
   */
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
    } catch {
      // Silent error handling for tokenization issues
    }

    return tokens;
  }

  /**
   * Validate PPL code using ANTLR parser
   */
  validate(code: string): PPLValidationResult {
    try {
      const { lexer, tokenStream } = this.createLexerAndTokenStream(code);

      // Add error listener to lexer
      const lexerErrorListener = new PPLSyntaxErrorListener();
      lexer.removeErrorListeners();
      lexer.addErrorListener(lexerErrorListener);

      const { parser, parserErrorListener } = this.createParserWithErrorHandling(tokenStream);

      parser.root();

      // Collect all errors from both lexer and parser
      const allErrors = [...lexerErrorListener.errors, ...parserErrorListener.errors];

      if (allErrors.length > 0) {
        return {
          isValid: false,
          errors: allErrors,
        };
      }

      return {
        isValid: true,
        errors: [],
      };
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
    return this.analyzeLint(code, context).result;
  }

  /**
   * Parse once for static lint and, on a clean query with an active explain
   * rule, also serialize the parser-owned source candidates the Explain
   * attribution/range-narrowing pass needs. `attribution` is left `undefined`
   * for empty input, syntax errors, or when no explain rule applies — the
   * explain layer treats a missing snapshot as "resolve nothing, show wide"
   * (which the resolver never actually does — it drops instead).
   */
  analyzeLint(code: string, context?: LintRunContext): CompiledPPLLintAnalysis {
    try {
      const trimmed = code.trimStart();
      const isPipeFirst = trimmed.startsWith('|');
      const effectiveCode = isPipeFirst ? PIPE_FIRST_PREFIX + code : code;

      const { lexer, tokenStream } = this.createLexerAndTokenStream(effectiveCode);
      const { parser, lexerErrorListener, parserErrorListener } =
        this.createParserWithErrorHandling(tokenStream, lexer);
      const ruleNameToIndex = createCompiledRuleNameToIndex();
      const tree = parser.root();

      const diagnostics = runLint(tree, {
        ruleNameToIndex,
        dataSourceVersion: context?.dataSourceVersion,
        // Declare the surface AND the source text so the field-slot shape pass
        // can run a narrow text-side detector here (on the simplified grammar
        // `grok field=body` error-recovers and can't be read off the tree).
        context: { ...context, sourceText: effectiveCode, grammarSurface: 'compiled-simplified' },
      });

      const result = {
        diagnostics: isPipeFirst ? remapPipeFirstColumns(diagnostics) : diagnostics,
      };

      // Only build the attribution snapshot on a fully clean parse with an
      // applicable explain rule: the candidates are source-offset spans, so a
      // half-parsed tree would produce misaligned ranges, and there is no point
      // paying for the walk when no explain rule will consume it.
      if (
        !code.trim() ||
        lexerErrorListener.errors.length > 0 ||
        parserErrorListener.errors.length > 0 ||
        !hasExplainRules({
          overrides: context?.overrides,
          dataSourceVersion: context?.dataSourceVersion,
          isCalcite: context?.isCalcite,
        })
      ) {
        return { result };
      }

      return {
        result,
        attribution: buildExplainAttributionSnapshot(tree, ruleNameToIndex, effectiveCode, {
          parserPrefixLength: isPipeFirst ? PIPE_FIRST_PREFIX.length : 0,
          typeMap: context?.typeMap,
        }),
      };
    } catch {
      return { result: { diagnostics: [] } };
    }
  }

  /**
   * Validate a batch of generated probe queries in one worker round trip. Every
   * query gets the same pipe-first preprocessing the attribution snapshot used,
   * so a probe built from a pipe-first source is judged on the same surface.
   * Returns one boolean per input: true only when the query parses with no lexer
   * or parser error.
   */
  validateLintQueries(queries: string[]): boolean[] {
    if (!Array.isArray(queries) || queries.some((query) => typeof query !== 'string')) {
      throw new TypeError('validateLintQueries expects an array of strings');
    }
    return queries.map((query) => {
      if (!query.trim()) {
        return false;
      }
      try {
        const isPipeFirst = query.trimStart().startsWith('|');
        const effectiveCode = isPipeFirst ? PIPE_FIRST_PREFIX + query : query;
        const { lexer, tokenStream } = this.createLexerAndTokenStream(effectiveCode);
        const { parser, lexerErrorListener, parserErrorListener } =
          this.createParserWithErrorHandling(tokenStream, lexer);
        parser.root();
        return lexerErrorListener.errors.length === 0 && parserErrorListener.errors.length === 0;
      } catch {
        return false;
      }
    });
  }

  /**
   * Get token type name from ANTLR token type
   */
  private getTokenTypeName(tokenType: number, lexer: OpenSearchPPLLexer): string {
    const vocabulary = lexer.vocabulary;
    const symbolicName = vocabulary.getSymbolicName(tokenType);

    if (symbolicName) {
      return symbolicName.toLowerCase();
    }

    const literalName = vocabulary.getLiteralName(tokenType);
    if (literalName) {
      return literalName.replace(/['"]/g, '');
    }

    return 'unknown';
  }
}

/**
 * Singleton instance of PPL Language Analyzer
 * Provides a shared instance for efficient memory usage across the application
 */
let pplLanguageAnalyzerInstance: PPLLanguageAnalyzer | null = null;

/**
 * Get or create the singleton instance of PPL Language Analyzer
 */
export const getPPLLanguageAnalyzer = (): PPLLanguageAnalyzer => {
  if (!pplLanguageAnalyzerInstance) {
    pplLanguageAnalyzerInstance = new PPLLanguageAnalyzer();
  }
  return pplLanguageAnalyzerInstance;
};
