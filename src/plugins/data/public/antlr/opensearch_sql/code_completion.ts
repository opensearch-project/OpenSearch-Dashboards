/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { stringify } from '@osd/std';
import {
  CharStream,
  CommonTokenStream,
  Lexer as LexerType,
  ParserRuleContext,
  Parser as ParserType,
  Token,
} from 'antlr4ng';
import { CodeCompletionCore } from 'antlr4-c3';
import { OpenSearchSQLLexer } from './generated/OpenSearchSQLLexer';
import { OpenSearchSQLParser } from './generated/OpenSearchSQLParser';
import {
  AutocompleteResultBase,
  CursorPosition,
  EnrichAutocompleteResult,
  GetParseTree,
  KeywordSuggestion,
  LexerConstructor,
  OpenSearchSqlAutocompleteResult,
  ParserConstructor,
} from './types';
import { TokenDictionary } from './table';
import { createParser } from './parse';
import { SqlErrorListener } from './sql_error_listerner';
import { findCursorTokenIndex } from './cursor';
import { openSearchSqlAutocompleteData } from './opensearch_sql_autocomplete';
import { getUiSettings } from '../../services';
import { SQL_SYMBOLS } from './constants';

const getSymbolSuggestionType = (field: string) => {
  if (SQL_SYMBOLS.KEY_WORDS.includes(field)) {
    return 'keyword';
  } else if (SQL_SYMBOLS.FUNCTIONS.includes(field)) {
    return 'function';
  }
  return 'text';
};

export const getSuggestions = async ({ selectionStart, selectionEnd, query }) => {
  const { api } = getUiSettings();
  const suggestions = getOpenSearchSqlAutoCompleteSuggestions(query, {
    line: 1,
    column: selectionStart + 1,
  });

  console.log('built in suggestions: ', suggestions);

  const finalSuggestions = [];

  // fetch columns and values
  if ('suggestColumns' in suggestions && (suggestions.suggestColumns?.tables?.length ?? 0) > 0) {
    const tableNames = suggestions.suggestColumns?.tables?.map((table) => table.name) ?? [];
    const schemas = await fetchTableSchemas(tableNames, api);
    schemas.forEach((schema, index) => {
      if (schema.body?.fields?.length > 0) {
        const columns = schema.body.fields.find((col) => col.name === 'COLUMN_NAME');
        const fieldTypes = schema.body.fields.find((col) => col.name === 'COLUMN_NAME');
        finalSuggestions.push(
          ...columns.values.map((col: string) => ({
            text: col,
            type: 'field',
            fieldType: fieldTypes ? fieldTypes.values[index] : '',
          }))
        );
      }
    });

    if (
      'suggestValuesForColumn' in suggestions &&
      /\S/.test(suggestions.suggestValuesForColumn as string) &&
      suggestions.suggestValuesForColumn !== undefined
    ) {
      const values = await fetchColumnValues(
        tableNames,
        suggestions.suggestValuesForColumn as string,
        api
      );
      values.forEach((value) => {
        if (value.body?.fields?.length > 0) {
          finalSuggestions.push(
            ...value.body.fields[0].values.map((colVal: string) => ({
              text: `'${colVal}'`,
              type: 'value',
            }))
          );
        }
      });
    }
  }

  if (suggestions.suggestScalarFunctions) {
    // finalSuggestions.push(
    //   ...suggestions.suggestFunctions.map((sf) => ({
    //     text: sf.value,
    //     description: sf.description,
    //   }))
    // );
  }

  // fetch functions
  if ('suggestAggregateFunctions' in suggestions && suggestions.suggestAggregateFunctions) {
  }

  if ('suggestKeywords' in suggestions && (suggestions.suggestKeywords?.length ?? 0) > 0) {
    finalSuggestions.push(
      ...suggestions.suggestKeywords!.map((sk) => ({
        text: sk.value,
        type: getSymbolSuggestionType(sk.value),
      }))
    );
  }

  return finalSuggestions;
};

const fetchColumnValues = async (tables: string[], column: string, api) => {
  return Promise.all(
    tables.map(async (table) => {
      const body = stringify({
        query: { qs: `SELECT DISTINCT ${column} FROM ${table} LIMIT 10`, format: 'jdbc' },
        df: null,
      });
      return api.http.fetch({
        method: 'POST',
        path: '/api/enhancements/search/sql',
        body,
        undefined,
      });
    })
  );
};

const fetchTableSchemas = async (tables: string[], api) => {
  return Promise.all(
    tables.map(async (table) => {
      const body = stringify({
        query: { qs: `DESCRIBE TABLES LIKE ${table}`, format: 'jdbc' },
        df: null,
      });
      return api.http.fetch({
        method: 'POST',
        path: '/api/enhancements/search/sql',
        body,
        undefined,
      });
    })
  );
};

const quotesRegex = /^'(.*)'$/;

export interface ParsingSubject<A extends AutocompleteResultBase, L, P> {
  Lexer: LexerConstructor<L>;
  Parser: ParserConstructor<P>;
  tokenDictionary: TokenDictionary;
  ignoredTokens: Set<number>;
  rulesToVisit: Set<number>;
  getParseTree: GetParseTree<P>;
  enrichAutocompleteResult: EnrichAutocompleteResult<A>;
  query: string;
  cursor: CursorPosition;
  context?: ParserRuleContext;
}

export const parseQuery = <
  A extends AutocompleteResultBase,
  L extends LexerType,
  P extends ParserType
>({
  Lexer,
  Parser,
  tokenDictionary,
  ignoredTokens,
  rulesToVisit,
  getParseTree,
  enrichAutocompleteResult,
  query,
  cursor,
  context,
}: ParsingSubject<A, L, P>) => {
  const parser = createParser(Lexer, Parser, query);
  const { tokenStream } = parser;
  const errorListener = new SqlErrorListener(tokenDictionary.SPACE);

  parser.removeErrorListeners();
  parser.addErrorListener(errorListener);
  getParseTree(parser);

  const core = new CodeCompletionCore(parser);
  core.ignoredTokens = ignoredTokens;
  core.preferredRules = rulesToVisit;
  const cursorTokenIndex = findCursorTokenIndex(tokenStream, cursor, tokenDictionary.SPACE);
  if (cursorTokenIndex === undefined) {
    throw new Error(
      `Could not find cursor token index for line: ${cursor.line}, column: ${cursor.column}`
    );
  }

  const suggestKeywords: KeywordSuggestion[] = [];
  const { tokens, rules } = core.collectCandidates(cursorTokenIndex, context);
  console.log(
    'core.collectCandidates(cursorTokenIndex, context): ',
    core.collectCandidates(cursorTokenIndex, context)
  );
  console.log('tokens: ', tokens, ' rules: ', rules);
  console.log('getTokenTypeMap: ', parser.getTokenTypeMap());
  tokens.forEach((_, tokenType) => {
    // Literal keyword names are quoted
    const literalName = parser.vocabulary.getLiteralName(tokenType)?.replace(quotesRegex, '$1');

    if (!literalName) {
      throw new Error(`Could not get literal name for token ${tokenType}`);
    }

    suggestKeywords.push({
      value: literalName,
    });
  });

  const result: AutocompleteResultBase = {
    errors: errorListener.errors,
    suggestKeywords,
  };

  return enrichAutocompleteResult(result, rules, tokenStream, cursorTokenIndex, cursor, query);
};

export const getOpenSearchSqlAutoCompleteSuggestions = (
  query: string,
  cursor: CursorPosition
): OpenSearchSqlAutocompleteResult => {
  return parseQuery({
    Lexer: openSearchSqlAutocompleteData.Lexer,
    Parser: openSearchSqlAutocompleteData.Parser,
    tokenDictionary: openSearchSqlAutocompleteData.tokenDictionary,
    ignoredTokens: openSearchSqlAutocompleteData.ignoredTokens,
    rulesToVisit: openSearchSqlAutocompleteData.rulesToVisit,
    getParseTree: openSearchSqlAutocompleteData.getParseTree,
    enrichAutocompleteResult: openSearchSqlAutocompleteData.enrichAutocompleteResult,
    query,
    cursor,
  });
};
