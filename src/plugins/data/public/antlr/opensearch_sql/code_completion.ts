/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { Lexer as LexerType, ParserRuleContext, Parser as ParserType } from 'antlr4ng';
import { CodeCompletionCore } from 'antlr4-c3';
import {
  AutocompleteResultBase,
  CursorPosition,
  EnrichAutocompleteResult,
  GetParseTree,
  KeywordSuggestion,
  LexerConstructor,
  OpenSearchSqlAutocompleteResult,
  ParserConstructor,
} from '../shared/types';
import { TokenDictionary } from './table';
import { createParser } from './parse';
import { SqlErrorListener } from './sql_error_listerner';
import { findCursorTokenIndex } from '../shared/cursor';
import { openSearchSqlAutocompleteData } from './opensearch_sql_autocomplete';
import { SQL_SYMBOLS } from './constants';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { fetchTableSchemas } from '../shared/utils';
import { IDataFrameResponse, IFieldType } from '../../../common';

export interface SuggestionParams {
  position: monaco.Position;
  query: string;
}

export interface ISuggestionItem {
  text: string;
  type: string;
  fieldType?: string;
}

const quotesRegex = /^'(.*)'$/;

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  position,
  query,
  services,
}: QuerySuggestionGetFnArgs): Promise<QuerySuggestion[]> => {
  const { api } = services.uiSettings;
  const queryString = services.data.query.queryString;
  const { lineNumber, column } = position || {};
  const suggestions = getOpenSearchSqlAutoCompleteSuggestions(query, {
    line: lineNumber || selectionStart,
    column: column || selectionEnd,
  });

  const finalSuggestions: QuerySuggestion[] = [];

  try {
    // Fetch columns and values
    if (suggestions.suggestColumns?.tables?.length) {
      const tableNames = suggestions.suggestColumns.tables.map((table) => table.name);
      const schemas = await fetchTableSchemas(tableNames, api, queryString);

      (schemas as IDataFrameResponse[]).forEach((schema: IDataFrameResponse) => {
        if ('body' in schema && schema.body && 'fields' in schema.body) {
          const columns = schema.body.fields.find((col: IFieldType) => col.name === 'COLUMN_NAME');
          const fieldTypes = schema.body.fields.find((col: IFieldType) => col.name === 'DATA_TYPE');

          if (columns && fieldTypes) {
            finalSuggestions.push(
              ...columns.values.map((col: string) => ({
                text: col,
                type: monaco.languages.CompletionItemKind.Field,
              }))
            );
          }
        }
      });
    }

    // Fill in aggregate functions
    if (suggestions.suggestAggregateFunctions) {
      finalSuggestions.push(
        ...SQL_SYMBOLS.AGREGATE_FUNCTIONS.map((af) => ({
          text: af,
          type: monaco.languages.CompletionItemKind.Function,
        }))
      );
    }

    // Fill in SQL keywords
    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value,
          type: monaco.languages.CompletionItemKind.Keyword,
        }))
      );
    }
  } catch (error) {
    // TODO: Handle errors appropriately, possibly logging or displaying a message to the user
    return [];
  }

  return finalSuggestions;
};

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
