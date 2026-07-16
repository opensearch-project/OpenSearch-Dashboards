/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharStream, CommonTokenStream, Token } from 'antlr4ng';
import { CodeCompletionCore } from 'antlr4-c3';
import { OpenSearchPPLSearchOnlyLexer, OpenSearchPPLSearchOnlyParser } from '@osd/antlr-grammar';

export interface SearchAnalysis {
  suggestFields: boolean;
  suggestValuesForField?: string;
  keywords: string[];
  replaceStart: number;
  replaceEnd: number;
  partial: string;
}

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

const tokenEnd = (t: Token) => t.column + (t.text?.length || 0);

function findCursorTokenIndex(tokenStream: CommonTokenStream, cursorColumn: number): number {
  for (let i = 0; i < tokenStream.size; i++) {
    const token = tokenStream.get(i);
    if (token.type === Token.EOF) return i;
    const start = token.column;
    const end = tokenEnd(token);
    if (end >= cursorColumn) {
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
