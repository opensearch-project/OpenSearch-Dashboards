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
import { quotesRegex, SuggestionItemDetailsTags } from './constants';
import { IndexPattern, IndexPatternField } from '../../index_patterns';
import { IDataPluginServices } from '../../types';
import { DEFAULT_DATA, UI_SETTINGS } from '../../../common';
import { MonacoCompatibleQuerySuggestion } from '../../autocomplete/providers/query_suggestion_provider';

export interface IDataSourceRequestHandlerParams {
  dataSourceId: string;
  title: string;
}

export const removePotentialBackticks = (str: string): string => {
  return str.replace(/^`?|\`?$/g, ''); // removes backticks only if they exist at the beginning and end
};

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

const fetchFromAPI = async (http: HttpSetup, body: string) => {
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
  http: HttpSetup,
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

export const fetchColumnValues = async (
  table: string,
  column: string,
  services: IDataPluginServices,
  fieldInOsd: IndexPatternField | undefined,
  datasetType: string | undefined
): Promise<any[]> => {
  if (!datasetType || !Object.values(DEFAULT_DATA.SET_TYPES).includes(datasetType)) {
    return [];
  }

  // default to true/false values for type boolean
  if (fieldInOsd?.type === 'boolean') {
    return ['true', 'false'];
  }

  const allowedType = ['string'];
  // don't return values if ui settings prevent it or the field type isn't allowed
  if (
    !services.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES) ||
    !fieldInOsd ||
    !allowedType.includes(fieldInOsd.type)
  ) {
    return [];
  }
  const limit = services.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES_LIMIT);

  // get dataset for connecting to the cluster currently engaged
  const dataset = services.data.query.queryString.getQuery().dataset;

  return (
    await fetchFromAPI(
      services.http,
      JSON.stringify({
        query: {
          query: `SELECT ${column} FROM ${table} GROUP BY ${column} ORDER BY COUNT(${column}) DESC LIMIT ${limit}`,
          language: 'SQL',
          format: 'jdbc',
          dataset,
        },
      })
    )
  ).body.fields[0].values;
};

export const formatValuesToSuggestions = <T extends { toString(): string }>(
  values: T[], // generic for any value type
  modifyInsertText?: (input: T) => string
) => {
  let i = 0;

  const valueSuggestions: MonacoCompatibleQuerySuggestion[] = values.map((val: T) => {
    i++;
    return {
      text: val.toString(),
      type: monaco.languages.CompletionItemKind.Value,
      detail: SuggestionItemDetailsTags.Value,
      sortText: i.toString().padStart(values.length.toString().length + 1, '0'), // keeps the order of sorted values
      ...(modifyInsertText && { insertText: modifyInsertText(val) }),
    };
  });

  return valueSuggestions;
};

export const formatFieldsToSuggestions = (
  indexPattern: IndexPattern,
  modifyInsertText?: (input: string) => string,
  sortTextImportance?: string
) => {
  const filteredFields = indexPattern.fields.filter(
    (idxField: IndexPatternField) => !idxField?.subType
  ); // filter removed .keyword fields

  const fieldSuggestions: MonacoCompatibleQuerySuggestion[] = filteredFields.map((field) => {
    return {
      text: field.name,
      type: monaco.languages.CompletionItemKind.Field,
      detail: `Field: ${field.esTypes?.[0] ?? field.type}`,
      ...(modifyInsertText && { insertText: modifyInsertText(field.name) }), // optionally include insert text if fn exists
      ...(sortTextImportance && { sortText: sortTextImportance }),
    };
  });

  return fieldSuggestions;
};

const singleParseQuery = <
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
}: ParsingSubject<A, L, P>): A => {
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
}: ParsingSubject<A, L, P>): AutocompleteResultBase => {
  const result = singleParseQuery({
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
  });

  if (!result.rerunWithoutRules) {
    return result;
  }

  // go through each rule in list and run a singleParseQuery without it, combining results
  result.rerunWithoutRules.forEach((rule) => {
    const modifiedRulesToVisit = new Set(rulesToVisit);
    modifiedRulesToVisit.delete(rule);

    const nextResult = singleParseQuery({
      Lexer,
      Parser,
      tokenDictionary,
      ignoredTokens,
      rulesToVisit: modifiedRulesToVisit,
      getParseTree,
      enrichAutocompleteResult,
      query,
      cursor,
      context,
    });

    // combine results from result and nextResult
    // the combination logic is as follows:
    // Array: it will combine the results of the array
    // Boolean: we're operating under the assumption that it is a flag, so it needs to
    //    be kept 'on' in the combined result
    // Undefined: we're looking at the type in the initial result, so we default to the
    //    latter result
    // Any other type: we know this field isn't undefined, but the combination behavior
    //    is not significant yet, so we default to the initial result. More types could
    //    be added later if needed, but this is kept unobtrusive.
    for (const [field, value] of Object.entries(result)) {
      if (field === 'suggestColumns') {
        // combine tables inside of suggestColumns
        if (result.suggestColumns || nextResult.suggestColumns) {
          result.suggestColumns = {
            tables: [
              ...(result.suggestColumns?.tables ?? []),
              ...(nextResult.suggestColumns?.tables ?? []),
            ],
          };
        }
        continue;
      }

      switch (typeof value) {
        case 'boolean':
          // if a boolean is true, keep overall result true
          result[field as keyof A] ||= nextResult[field as keyof A];
          break;
        case 'undefined':
          // use the latter result
          result[field as keyof A] = nextResult[field as keyof A];
          break;
        case 'object':
          if (Array.isArray(value)) {
            // combine arrays
            const combined = [
              // @ts-expect-error TS2352 TODO(ts-error): fixme
              ...((result[field as keyof A] as any[]) ?? []),
              // @ts-expect-error TS2352 TODO(ts-error): fixme
              ...((nextResult[field as keyof A] as any[]) ?? []),
            ];
            // ES6 magic to filter out duplicate objects based on id field
            // @ts-expect-error TS2352 TODO(ts-error): fixme
            (result[field as keyof A] as any[]) = combined.filter(
              (item, index, self) => index === self.findIndex((other) => other.id === item.id)
            );
            break;
          }
        default:
          // use the initial result
          break;
      }
    }
  });

  return result;
};
