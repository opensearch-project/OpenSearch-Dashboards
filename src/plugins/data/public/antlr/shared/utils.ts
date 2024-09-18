/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { from } from 'rxjs';
import { distinctUntilChanged, startWith, switchMap } from 'rxjs/operators';
import { CodeCompletionCore } from 'antlr4-c3';
import { Lexer as LexerType, Parser as ParserType } from 'antlr4ng';
import { monaco } from '@osd/monaco';
import { HttpSetup } from 'opensearch-dashboards/public';
import { QueryStringContract } from '../../query';
import { findCursorTokenIndex } from './cursor';
import { GeneralErrorListener } from './general_error_listerner';
import { createParser } from '../opensearch_sql/parse';
import { AutocompleteResultBase, KeywordSuggestion } from './types';
import { ParsingSubject } from './types';
import { quotesRegex } from './constants';
import { IndexPattern, IndexPatternField } from '../../index_patterns';
import { QuerySuggestion } from '../../autocomplete';

export interface IDataSourceRequestHandlerParams {
  dataSourceId: string;
  title: string;
}

// Function to get raw suggestion data
export const getRawSuggestionData$ = (
  queryString: QueryStringContract,
  dataSourceRequestHandler: ({
    dataSourceId,
    title,
  }: IDataSourceRequestHandlerParams) => Promise<any>,
  defaultRequestHandler: () => Promise<any>
) =>
  queryString.getUpdates$().pipe(
    startWith(queryString.getQuery()),
    distinctUntilChanged(),
    switchMap((query) => {
      if (!query) {
        return from(defaultRequestHandler());
      }
      const dataSourceId = query.dataset?.dataSource?.id;
      const title = query.dataset?.dataSource?.title;
      if (!dataSourceId || !title) throw new Error();
      return from(dataSourceRequestHandler({ dataSourceId, title }));
    })
  );

const fetchFromAPI = async (http: any, body: string) => {
  try {
    return await http.fetch({
      method: 'POST',
      path: '/api/enhancements/search/sql',
      body,
    });
  } catch (err) {
    // TODO: pipe error to UI
    return Promise.reject(err);
  }
};

// Generic fetchData function
export const fetchData = (
  tables: string[],
  queryFormatter: (table: string, dataSourceId?: string, title?: string) => any,
  http: any,
  queryString: QueryStringContract
) => {
  return new Promise((resolve, reject) => {
    getRawSuggestionData$(
      queryString,
      ({ dataSourceId, title }) => {
        const requests = tables.map(async (table) => {
          const body = JSON.stringify(queryFormatter(table, dataSourceId, title));
          return fetchFromAPI(http, body);
        });
        return Promise.all(requests);
      },
      () => {
        const requests = tables.map(async (table) => {
          const body = JSON.stringify(queryFormatter(table));
          return fetchFromAPI(http, body);
        });
        return Promise.all(requests);
      }
    ).subscribe({
      next: (dataFrames: any) => resolve(dataFrames),
      error: (err: Error) => {
        // TODO: pipe error to UI
        reject(err);
      },
    });
  });
};

export const fetchColumnValues = (tables: string[], column: string, http: HttpSetup) => {
  return fetchFromAPI(
    http,
    JSON.stringify({
      query: {
        query: `SELECT ${column} FROM ${tables[0]} GROUP BY ${column} ORDER BY COUNT(${column}) DESC LIMIT 200`,
        language: 'SQL',
        dataset: {},
        format: 'jdbc',
      },
    })
  );
};

export const fetchFieldSuggestions = (
  indexPattern: IndexPattern,
  modifyInsertText?: (input: string) => string
) => {
  const filteredFields = indexPattern.fields.filter(
    (idxField: IndexPatternField) => !idxField?.subType
  ); // filter removed .keyword fields

  const fieldSuggestions: QuerySuggestion[] = filteredFields.map((field) => {
    return {
      text: field.name,
      type: monaco.languages.CompletionItemKind.Field,
      detail: `Field: ${field.esTypes?.[0] ?? field.type}`,
      ...(modifyInsertText && { insertText: modifyInsertText(field.name) }), // optionally include insert text if fn exists
    };
  });

  return fieldSuggestions;
};

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
  const errorListener = new GeneralErrorListener(tokenDictionary.SPACE);

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
      return;
    }

    suggestKeywords.push({
      value: literalName,
      id: tokenType,
    });
  });

  const result: AutocompleteResultBase = {
    errors: errorListener.errors,
    suggestKeywords,
  };

  return enrichAutocompleteResult(result, rules, tokenStream, cursorTokenIndex, cursor, query);
};
