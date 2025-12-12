/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { CursorPosition, PromQLAutocompleteResult } from '../shared/types';
import { openSearchPromQLAutocompleteData } from './promql_autocomplete';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { parseQuery } from '../shared/utils';
import { PrometheusResourceClient } from '../../resources/prometheus_resource_client';
import {
  aggregationOperators,
  functionNames,
  prometheusDocumentationWebsite,
  prometheusDurationUnits,
  PromQLSuggestionItemDescriptions,
} from './constants';
import { MonacoCompatibleQuerySuggestion } from '../../autocomplete/providers/query_suggestion_provider';

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
  if (!services || !services.appName || !indexPattern) return [];

  try {
    const { lineNumber, column } = position || {};
    const suggestions = getOpenSearchPromQLAutoCompleteSuggestions(query, {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    });
    const prometheusResourceClient = services.data.resourceClientFactory.get(
      'prometheus'
    ) as PrometheusResourceClient;

    const finalSuggestions: MonacoCompatibleQuerySuggestion[] = [];

    if (suggestions.suggestMetrics) {
      const metrics = await prometheusResourceClient.getMetricMetadata(indexPattern.id);
      finalSuggestions.push(
        ...Object.entries(metrics).map(([af, [{ type, help }]]) => ({
          text: `${af}`,
          type: monaco.languages.CompletionItemKind.Field,
          labelDescription: `${type} (metric)`,
          detail: help,
        }))
      );
    }

    if (suggestions.suggestLabels || suggestions.suggestLabels === '') {
      // TODO: figure out why partial label being typed will always appear regardless of metric before it
      const labels = await prometheusResourceClient.getLabels(
        indexPattern.id!,
        suggestions.suggestLabels !== '' ? suggestions.suggestLabels : undefined
      );
      finalSuggestions.push(
        ...labels.map((af: string) => ({
          text: `${af}`,
          type: monaco.languages.CompletionItemKind.Class,
          detail: PromQLSuggestionItemDescriptions.LABEL,
        }))
      );
    }

    if (suggestions.suggestLabelValues && suggestions.suggestLabelValues.label) {
      // TODO: match what's already typed to the suggestion name so that it appears when being typed
      // TODO: update when we can get metric name passed in
      const labelValues = await prometheusResourceClient.getLabelValues(
        indexPattern.id!,
        suggestions.suggestLabelValues.label
      );
      finalSuggestions.push(
        ...labelValues.map((af: string) => ({
          text: `${af}`,
          type: monaco.languages.CompletionItemKind.Interface,
          detail: PromQLSuggestionItemDescriptions.VALUE,
        }))
      );
    }

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
