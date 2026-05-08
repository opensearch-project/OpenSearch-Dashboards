/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { CursorPosition, PromQLAutocompleteResult } from '../shared/types';
import { openSearchPromQLAutocompleteData } from './promql_autocomplete';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { parseQuery } from '../shared/utils';
import {
  aggregationOperators,
  functionNames,
  prometheusDocumentationWebsite,
  prometheusDurationUnits,
  PromQLSuggestionItemDescriptions,
} from './constants';
import { MonacoCompatibleQuerySuggestion } from '../../autocomplete/providers/query_suggestion_provider';
import { DataView } from '../..';

export interface SuggestionParams {
  position: monaco.Position;
  query: string;
}

export interface ISuggestionItem {
  text: string;
  type: string;
  fieldType?: string;
}

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  indexPattern,
  position,
  query,
  services,
}: QuerySuggestionGetFnArgs): Promise<QuerySuggestion[]> => {
  if (!services || !services.appName) return [];

  try {
    const { lineNumber, column } = position || {};
    const suggestions = getOpenSearchPromQLAutoCompleteSuggestions(query, {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    });

    const finalSuggestions: MonacoCompatibleQuerySuggestion[] = [];

    // Add static suggestions (functions, aggregations, keywords, duration units) first
    if (suggestions.suggestTimeRangeUnits && lineNumber && column) {
      finalSuggestions.push(
        ...prometheusDurationUnits.map((af) => ({
          text: `${af}`,
          type: monaco.languages.CompletionItemKind.Unit,
          detail: PromQLSuggestionItemDescriptions.DURATION,
          replacePosition: new monaco.Range(lineNumber, column, lineNumber, column), // remove duration token association
        }))
      );
    }

    if (suggestions.suggestFunctionNames) {
      finalSuggestions.push(
        ...functionNames.map((func) => ({
          text: func,
          type: monaco.languages.CompletionItemKind.Function,
          detail: PromQLSuggestionItemDescriptions.FUNCTION,
          insertText: `${func}($0)`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        }))
      );
    }

    if (suggestions.suggestAggregationOperators) {
      finalSuggestions.push(
        ...aggregationOperators.map((agg) => ({
          text: agg,
          type: monaco.languages.CompletionItemKind.Function,
          detail: PromQLSuggestionItemDescriptions.AGGREGATION_OPERATOR,
          insertText: `${agg}($0)`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        }))
      );
    }

    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value,
          type: monaco.languages.CompletionItemKind.Keyword,
          insertText: `${sk.value}`,
          detail: PromQLSuggestionItemDescriptions.KEYWORD,
        }))
      );
    }

    // Add dynamic suggestions (metrics, labels, label values)
    const dataView = indexPattern as DataView;
    const dataConnectionId = dataView?.id ?? services.data.query.queryString.getQuery().dataset?.id;
    const meta = dataView?.dataSourceMeta;

    if (dataConnectionId) {
      const prometheusResourceClient = services.data.resourceClientFactory.get<any>('prometheus');

      if (prometheusResourceClient) {
        const timeRange = services.data.query.timefilter.timefilter.getTime();

        if (suggestions.suggestMetrics) {
          try {
            const metrics = await prometheusResourceClient.getMetrics(
              dataConnectionId,
              meta,
              timeRange
            );
            finalSuggestions.push(
              ...metrics.map((metric: string) => ({
                text: metric,
                type: monaco.languages.CompletionItemKind.Field,
                detail: PromQLSuggestionItemDescriptions.METRIC,
              }))
            );
          } catch {
            // Metrics fetch failed, but we still have static suggestions
          }
        }

        if (suggestions.suggestLabels || suggestions.suggestLabels === '') {
          try {
            const labels = await prometheusResourceClient.getLabels(
              dataConnectionId,
              meta,
              suggestions.suggestLabels !== '' ? suggestions.suggestLabels : undefined,
              timeRange
            );
            finalSuggestions.push(
              ...labels.map((af: string) => ({
                text: `${af}`,
                type: monaco.languages.CompletionItemKind.Class,
                detail: PromQLSuggestionItemDescriptions.LABEL,
              }))
            );
          } catch {
            // Labels fetch failed, but we still have static suggestions
          }
        }

        if (suggestions.suggestLabelValues && suggestions.suggestLabelValues.label) {
          try {
            const labelValues = await prometheusResourceClient.getLabelValues(
              dataConnectionId,
              meta,
              suggestions.suggestLabelValues.label,
              timeRange
            );
            finalSuggestions.push(
              ...labelValues.map((af: string) => ({
                text: `${af}`,
                type: monaco.languages.CompletionItemKind.Interface,
                detail: PromQLSuggestionItemDescriptions.VALUE,
              }))
            );
          } catch {
            // Label values fetch failed, but we still have static suggestions
          }
        }
      }
    }

    // add a link to prometheus documentation on every description
    finalSuggestions.forEach((sugg) => {
      sugg.documentation = prometheusDocumentationWebsite;
    });

    return finalSuggestions;
  } catch (error) {
    // TODO: Handle errors appropriately, possibly logging or displaying a message to the user
    return [];
  }
};

export const getOpenSearchPromQLAutoCompleteSuggestions = (
  query: string,
  cursor: CursorPosition
): PromQLAutocompleteResult => {
  return parseQuery({
    Lexer: openSearchPromQLAutocompleteData.Lexer,
    Parser: openSearchPromQLAutocompleteData.Parser,
    tokenDictionary: openSearchPromQLAutocompleteData.tokenDictionary,
    ignoredTokens: openSearchPromQLAutocompleteData.ignoredTokens,
    rulesToVisit: openSearchPromQLAutocompleteData.rulesToVisit,
    getParseTree: openSearchPromQLAutocompleteData.getParseTree,
    enrichAutocompleteResult: openSearchPromQLAutocompleteData.enrichAutocompleteResult,
    query,
    cursor,
  });
};
