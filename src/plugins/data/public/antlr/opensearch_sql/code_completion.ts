/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from 'packages/osd-monaco/target';
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
import { fetchColumnValues, fetchTableSchemas } from '../shared/utils';

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
  const dataSetManager = services.data.query.dataSet;
  const suggestions = getOpenSearchSqlAutoCompleteSuggestions(query, {
    line: position?.lineNumber || selectionStart,
    column: position?.column || selectionEnd,
  });

  const finalSuggestions = [];

  try {
    // Fetch columns and values
    if ('suggestColumns' in suggestions && (suggestions.suggestColumns?.tables?.length ?? 0) > 0) {
      const tableNames = suggestions.suggestColumns?.tables?.map((table) => table.name) ?? [];
      const schemas = await fetchTableSchemas(tableNames, api, services);

      schemas.forEach((schema) => {
        if (schema.body?.fields?.length > 0) {
          const columns = schema.body.fields.find((col: any) => col.name === 'COLUMN_NAME');
          const fieldTypes = schema.body.fields.find((col: any) => col.name === 'DATA_TYPE');
          if (columns && fieldTypes) {
            finalSuggestions.push(
              ...columns.values.map((col: string, index: number) => ({
                text: col,
                type: 'field',
                fieldType: fieldTypes.values[index],
              }))
            );
          }
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
          api,
          services
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

    // Fill in aggregate functions
    if ('suggestAggregateFunctions' in suggestions && suggestions.suggestAggregateFunctions) {
      finalSuggestions.push(
        ...SQL_SYMBOLS.AGREGATE_FUNCTIONS.map((af) => ({
          text: af,
          type: 'function',
        }))
      );
    }

    // Fill in SQL keywords
    if ('suggestKeywords' in suggestions && (suggestions.suggestKeywords?.length ?? 0) > 0) {
      finalSuggestions.push(
        ...(suggestions.suggestKeywords ?? []).map((sk) => ({
          text: sk.value,
          type: 'keyword',
        }))
      );
    }
  } catch (error) {
    // TODO: pipe error to the UI
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
