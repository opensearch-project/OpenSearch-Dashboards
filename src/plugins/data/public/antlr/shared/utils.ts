/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { from } from 'rxjs';
import { distinctUntilChanged, startWith, switchMap } from 'rxjs/operators';
import { CodeCompletionCore } from 'antlr4-c3';
import { Lexer as LexerType, ParserRuleContext, Parser as ParserType } from 'antlr4ng';
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
import { DEFAULT_DATA, IFieldType, UI_SETTINGS } from '../../../common';
import { MonacoCompatibleQuerySuggestion } from '../../autocomplete/providers/query_suggestion_provider';
import { getDataViews } from '../../services';

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
      path: `/api/enhancements/search/_sql`,
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

// TODO: Pass in a Query Object instead of indexPattern object
export const fetchColumnValues = async (
  table: string,
  column: string,
  services: IDataPluginServices,
  indexPattern: IndexPattern,
  datasetType: string | undefined,
  skipTimeFilter?: boolean
): Promise<any[]> => {
  const fieldInOsd = indexPattern.fields.getByName(column);

  if (!fieldInOsd?.isSuggestionAvailable()) {
    return [];
  }

  // For Boolean fields directly return the values
  if (fieldInOsd?.type === 'boolean') {
    return ['true', 'false'];
  }

  // Return cached Autocomplete Results if available
  if (fieldInOsd?.spec.suggestions?.values && fieldInOsd?.spec.suggestions?.values.length > 0) {
    return fieldInOsd.spec.suggestions.values;
  }

  // Return topQueryValues if available and fire async API call to update the cache for subsequent calls
  if (
    fieldInOsd?.spec.suggestions?.topValues &&
    fieldInOsd?.spec.suggestions?.topValues.length > 0
  ) {
    // Fire async API call to update cache in non-blocking manner
    updateFieldValuesAsync(
      table,
      column,
      services,
      indexPattern,
      datasetType,
      fieldInOsd,
      skipTimeFilter
    );
    return fieldInOsd.spec.suggestions.topValues;
  }

  // Fire a synchronous query to fetch values
  await updateFieldValuesAsync(
    table,
    column,
    services,
    indexPattern,
    datasetType,
    fieldInOsd,
    skipTimeFilter
  );

  // Return the results of synchronous calls
  return fieldInOsd?.spec.suggestions?.values ?? [];
};

// Non-blocking async function to update field values in background
const updateFieldValuesAsync = async (
  table: string,
  column: string,
  services: IDataPluginServices,
  indexPattern: IndexPattern,
  datasetType: string | undefined,
  fieldInOsd: IndexPatternField | undefined,
  skipTimeFilter?: boolean
): Promise<void> => {
  try {
    // Check if conditions allow API call
    if (!datasetType || !Object.values(DEFAULT_DATA.SET_TYPES).includes(datasetType)) {
      return;
    }
    if (
      !services.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES) ||
      !fieldInOsd ||
      !indexPattern
    ) {
      return;
    }

    const limit = services.uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_SUGGEST_VALUES_LIMIT);

    const dataView = await getDataViews().get(indexPattern.id!);
    const dataset = await getDataViews().convertToDataset(dataView);

    const searchSource = await services.data.search.searchSource.create();
    searchSource.setFields({
      index: dataView,
      query: {
        query: `source = ${escapeIdentifier(table)} | top ${limit} ${escapeIdentifier(column)}`,
        language: 'PPL',
        dataset,
      },
      skipTimeFilter,
    });

    const response = await searchSource.fetch();

    // Extract field values from response
    const values = response.hits.hits.map((hit) => hit._source?.[column]);

    if (values) {
      // Update the field with fresh API values
      if (!fieldInOsd.spec.suggestions) {
        fieldInOsd.spec.suggestions = {};
      }
      fieldInOsd.spec.suggestions.values = values;

      // Save the updated IndexPattern to cache
      getDataViews().saveToCache(indexPattern.id!, indexPattern as any);
    }
  } catch (error) {
    // Silently failing here not blocking the user
  }
};

export const formatValuesToSuggestions = <T extends { toString(): string | null } | null>(
  values: T[], // generic for any value type
  modifyInsertText?: (input: T) => string
) => {
  const valueSuggestions: MonacoCompatibleQuerySuggestion[] = values
    .filter((val) => val !== null) // Only using the notNull values
    .map((val: T, i) => {
      return {
        text: val?.toString() || '',
        type: monaco.languages.CompletionItemKind.Value,
        detail: SuggestionItemDetailsTags.Value,
        sortText: (i + 1).toString().padStart(values.length.toString().length + 1, '0'), // keeps the order of sorted values
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

export const formatAvailableFieldsToSuggestions = (
  availableFields: IFieldType[],
  modifyInsertText?: (input: string) => string,
  sortTextImportanceFunction?: (input: string) => string
) => {
  return availableFields.map((field) => {
    return {
      text: field.name,
      type: monaco.languages.CompletionItemKind.Field,
      detail: `Field: ${field.esTypes?.[0] ?? field.type}`,
      ...(modifyInsertText && { insertText: modifyInsertText(field.name) }), // optionally include insert text if fn exists
      ...(sortTextImportanceFunction && { sortText: sortTextImportanceFunction(field.name) }),
    };
  });
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
  skipSymbolicKeywords,
}: ParsingSubject<A, L, P>): A => {
  const parser = createParser(Lexer, Parser, query);
  const { tokenStream } = parser;
  const errorListener = new GeneralErrorListener(tokenDictionary.SPACE);

  parser.removeErrorListeners();
  parser.addErrorListener(errorListener);
  const parseTree = getParseTree(parser);

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

  const { tokens, rules } = core.collectCandidates(
    cursorTokenIndex,
    (parseTree as unknown) as ParserRuleContext
  );

  tokens.forEach((producerRules, tokenType) => {
    // Literal keyword names are quoted
    const literalName = parser.vocabulary.getLiteralName(tokenType)?.replace(quotesRegex, '$1');
    let symbolicName;
    if (!skipSymbolicKeywords) {
      symbolicName = parser.vocabulary.getSymbolicName(tokenType);
    }
    if (!literalName && skipSymbolicKeywords) return;

    suggestKeywords.push({
      value: literalName || '',
      symbolicName: symbolicName || '',
      id: tokenType,
    });
  });

  const result: AutocompleteResultBase = {
    errors: errorListener.errors,
    suggestKeywords,
  };

  return enrichAutocompleteResult(
    result,
    rules,
    tokenStream,
    cursorTokenIndex,
    cursor,
    query,
    parseTree
  );
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
  skipSymbolicKeywords = true,
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
    skipSymbolicKeywords,
  });

  let rerunWithoutRules = result.rerunWithoutRules;

  while (rerunWithoutRules && rerunWithoutRules.length > 0) {
    // Remove all unvisited rules from rulesToVisit at once
    const modifiedRulesToVisit = new Set(rulesToVisit);
    rerunWithoutRules.forEach((rule) => modifiedRulesToVisit.delete(rule));

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
      skipSymbolicKeywords,
    });

    // merge logic
    for (const [field, value] of Object.entries(result)) {
      if (field === 'suggestColumns') {
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

      if (field === 'suggestKeywords') {
        const currentKeywords = result.suggestKeywords ?? [];
        const nextKeywords = nextResult.suggestKeywords ?? [];
        const keywordMap = new Map<number, KeywordSuggestion>();
        currentKeywords.forEach((kw) => {
          if (kw?.id !== undefined) keywordMap.set(kw.id, kw);
        });
        nextKeywords.forEach((kw) => {
          if (kw?.id !== undefined && !keywordMap.has(kw.id)) {
            keywordMap.set(kw.id, kw);
          }
        });
        result.suggestKeywords = Array.from(keywordMap.values());
        continue;
      }

      switch (typeof value) {
        case 'boolean':
          result[field as keyof A] ||= nextResult[field as keyof A];
          break;
        case 'undefined':
          result[field as keyof A] = nextResult[field as keyof A];
          break;
        case 'object':
          if (Array.isArray(value)) {
            const combined = [
              ...(((result[field as keyof A] as unknown) as any[]) ?? []),
              ...(((nextResult[field as keyof A] as unknown) as any[]) ?? []),
            ];
            ((result[field as keyof A] as unknown) as any[]) = combined.filter(
              (item, index, self) => index === self.findIndex((other) => other.id === item.id)
            );
          }
          break;
        default:
          break;
      }
    }

    rerunWithoutRules = nextResult.rerunWithoutRules;
  }

  return result;
};

function escapeIdentifier(name: string) {
  // Escape backticks inside name by doubling them
  return '`' + name.replace(/`/g, '``') + '`';
}
