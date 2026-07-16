/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, Token } from 'antlr4ng';
import { CodeCompletionCore } from 'antlr4-c3';
import { OpenSearchPPLSearchOnlyLexer, OpenSearchPPLSearchOnlyParser } from '@osd/antlr-grammar';

/**
 * Grammar-driven analysis of the "Search for" expression at a cursor position.
 *
 * This drives autocomplete for the PPL `search` command's search-expression
 * syntax ONLY (full-text terms, `field <op> value`, `IN (...)`, `AND`/`OR`/`NOT`,
 * parentheses) — not the full PPL pipeline. It uses antlr4-c3's
 * {@link CodeCompletionCore} over the restricted {@link OpenSearchPPLSearchOnlyParser} so that
 * fields, values, operators, and boolean keywords are each suggested only where
 * the grammar actually permits them at the caret.
 */
export interface SearchAnalysis {
  /** Suggest field names (cursor is where a field / bare term is expected). */
  suggestFields: boolean;
  /** When set, suggest values for this field (cursor is on a comparison RHS). */
  suggestValuesForField?: string;
  /** Operator / boolean-keyword texts valid at the caret (e.g. `=`, `AND`). */
  keywords: string[];
  /** Char range [start, end) of the token under the caret, for replacement. */
  replaceStart: number;
  replaceEnd: number;
  /** The partial text already typed for the token under the caret. */
  partial: string;
}

// Operators and boolean keywords, mapped to the text we surface. Comparison
// operators use their literal symbol; keywords use their upper-case name.
const OPERATOR_TOKENS: Record<number, string> = {
  [OpenSearchPPLSearchOnlyParser.EQ]: '=',
  [OpenSearchPPLSearchOnlyParser.NEQ]: '!=',
  [OpenSearchPPLSearchOnlyParser.GT]: '>',
  [OpenSearchPPLSearchOnlyParser.GE]: '>=',
  [OpenSearchPPLSearchOnlyParser.LT]: '<',
  [OpenSearchPPLSearchOnlyParser.LE]: '<=',
};
const KEYWORD_TOKENS: Record<number, string> = {
  [OpenSearchPPLSearchOnlyParser.AND]: 'AND',
  [OpenSearchPPLSearchOnlyParser.OR]: 'OR',
  [OpenSearchPPLSearchOnlyParser.NOT]: 'NOT',
  [OpenSearchPPLSearchOnlyParser.IN]: 'IN',
};

const WS = OpenSearchPPLSearchOnlyParser.WS;
const VALUE_LIKE = new Set<number>([
  OpenSearchPPLSearchOnlyParser.PHRASE,
  OpenSearchPPLSearchOnlyParser.TERM,
  OpenSearchPPLSearchOnlyParser.BACKTICK,
]);
const COMPARISON_OPS = new Set<number>([
  OpenSearchPPLSearchOnlyParser.EQ,
  OpenSearchPPLSearchOnlyParser.NEQ,
  OpenSearchPPLSearchOnlyParser.GT,
  OpenSearchPPLSearchOnlyParser.GE,
  OpenSearchPPLSearchOnlyParser.LT,
  OpenSearchPPLSearchOnlyParser.LE,
]);

/** Exclusive 0-based char offset where a token ends. */
const tokenEnd = (t: Token) => t.column + (t.text?.length || 0);

/** Find the 1-based-safe token index the caret sits in/before (0-based column). */
function findCursorTokenIndex(tokenStream: CommonTokenStream, cursorColumn: number): number {
  for (let i = 0; i < tokenStream.size; i++) {
    const token = tokenStream.get(i);
    if (token.type === Token.EOF) return i;
    const start = token.column;
    const end = tokenEnd(token);
    if (end >= cursorColumn) {
      // If the caret is just past a whitespace/operator/paren/comma boundary, the
      // relevant candidates belong to the next slot.
      const moveNext =
        token.type === WS ||
        COMPARISON_OPS.has(token.type) ||
        token.type === OpenSearchPPLSearchOnlyParser.LPAREN ||
        token.type === OpenSearchPPLSearchOnlyParser.COMMA ||
        token.type === OpenSearchPPLSearchOnlyParser.IN;
      if (moveNext && cursorColumn >= end) return i + 1;
      if (start > cursorColumn) return i;
      return i;
    }
  }
  return tokenStream.size > 0 ? tokenStream.size - 1 : 0;
}

/** Walk back from the caret token to the field name governing a value position. */
function findGoverningField(tokenStream: CommonTokenStream, cursorIndex: number): string | null {
  let i = cursorIndex - 1;
  while (i >= 0) {
    const t = tokenStream.get(i);
    if (t.type === WS) {
      i--;
      continue;
    }
    if (COMPARISON_OPS.has(t.type) || t.type === OpenSearchPPLSearchOnlyParser.IN) {
      i--;
      while (i >= 0 && tokenStream.get(i).type === WS) i--;
      if (i >= 0) {
        const f = tokenStream.get(i);
        if (
          f.type === OpenSearchPPLSearchOnlyParser.TERM ||
          f.type === OpenSearchPPLSearchOnlyParser.BACKTICK
        ) {
          return f.text || null;
        }
      }
      return null;
    }
    if (
      VALUE_LIKE.has(t.type) ||
      t.type === OpenSearchPPLSearchOnlyParser.COMMA ||
      t.type === OpenSearchPPLSearchOnlyParser.LPAREN
    ) {
      i--;
      continue;
    }
    break;
  }
  return null;
}

/**
 * Analyze the search expression at a caret (0-based char offset) and report what
 * to suggest. Returns a "suggest fields" default on empty/whitespace input.
 */
export function analyzeSearchExpression(query: string, cursorColumn: number): SearchAnalysis {
  const empty: SearchAnalysis = {
    suggestFields: true,
    keywords: [],
    replaceStart: cursorColumn,
    replaceEnd: cursorColumn,
    partial: '',
  };
  try {
    const inputStream = CharStream.fromString(query);
    const lexer = new OpenSearchPPLSearchOnlyLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new OpenSearchPPLSearchOnlyParser(tokenStream);
    parser.removeErrorListeners();
    parser.searchExpression();
    tokenStream.fill();

    const cursorIndex = findCursorTokenIndex(tokenStream, cursorColumn);

    // Compute the replacement range from the token under the caret. We only
    // replace a word-like token when the caret is strictly inside it or at its
    // end — i.e. the user is editing the text they just typed. When the caret is
    // at the exact START of a token (e.g. just after a space, before an existing
    // `field=value` term), accepting a suggestion should INSERT at the caret, not
    // clobber the following word, so the range stays empty.
    let replaceStart = cursorColumn;
    let replaceEnd = cursorColumn;
    let partial = '';
    const here = cursorIndex < tokenStream.size ? tokenStream.get(cursorIndex) : null;
    if (
      here &&
      here.type !== Token.EOF &&
      here.type !== WS &&
      (here.type === OpenSearchPPLSearchOnlyParser.TERM ||
        here.type === OpenSearchPPLSearchOnlyParser.PHRASE ||
        here.type === OpenSearchPPLSearchOnlyParser.BACKTICK)
    ) {
      const start = here.column;
      const end = tokenEnd(here);
      if (cursorColumn > start && cursorColumn <= end) {
        replaceStart = start;
        replaceEnd = end;
        partial = here.text?.slice(0, cursorColumn - start) || '';
      }
    }

    const core = new CodeCompletionCore(parser);
    core.preferredRules = new Set([
      OpenSearchPPLSearchOnlyParser.RULE_field,
      OpenSearchPPLSearchOnlyParser.RULE_value,
      OpenSearchPPLSearchOnlyParser.RULE_term,
    ]);
    core.ignoredTokens = new Set([OpenSearchPPLSearchOnlyParser.RPAREN]);

    const candidates = core.collectCandidates(cursorIndex);

    const rules = candidates.rules;
    const suggestFields =
      rules.has(OpenSearchPPLSearchOnlyParser.RULE_field) ||
      rules.has(OpenSearchPPLSearchOnlyParser.RULE_term);

    // Values are suggested when the grammar expects a value (comparison RHS or IN
    // list). Resolve the governing field so we can fetch its value suggestions.
    let suggestValuesForField: string | undefined;
    if (rules.has(OpenSearchPPLSearchOnlyParser.RULE_value)) {
      const field = findGoverningField(tokenStream, cursorIndex);
      if (field) suggestValuesForField = field;
    }

    const keywords: string[] = [];
    for (const token of candidates.tokens.keys()) {
      if (OPERATOR_TOKENS[token]) keywords.push(OPERATOR_TOKENS[token]);
      else if (KEYWORD_TOKENS[token]) keywords.push(KEYWORD_TOKENS[token]);
    }

    return { suggestFields, suggestValuesForField, keywords, replaceStart, replaceEnd, partial };
  } catch {
    return empty;
  }
}
