/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { CursorPosition, PromQLAutocompleteResult } from '../shared/types';
import { openSearchPromQLAutocompleteData } from './promql_autocomplete';
import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { parseQuery } from '../shared/utils';
import { SuggestionItemDetailsTags } from '../shared/constants';
import { PrometheusResourceClient } from '../../resources/prometheus_resource_client';

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
  dataset,
  position,
  query,
  services,
}: QuerySuggestionGetFnArgs): Promise<QuerySuggestion[]> => {
  if (!services || !services.appName || !indexPattern || !dataset) return [];
  try {
    const { lineNumber, column } = position || {};
    const suggestions = getOpenSearchPromQLAutoCompleteSuggestions(query, {
      line: lineNumber || selectionStart,
      column: column || selectionEnd,
    });
    const prometheusResourceClient = services.data.resourceClientFactory.get(
      'prometheus'
    ) as PrometheusResourceClient;

    const finalSuggestions: QuerySuggestion[] = [];

    if (suggestions.suggestMetrics) {
      const metrics = await prometheusResourceClient.getMetricMetadata(dataset.id);
      finalSuggestions.push(
        ...Object.keys(metrics).map((af) => ({
          text: `${af}`,
          type: monaco.languages.CompletionItemKind.Method,
          detail: SuggestionItemDetailsTags.AggregateFunction,
        }))
      );
    }

    if (suggestions.suggestLabels || suggestions.suggestLabels === '') {
      // TODO: figure out why partial label being typed will always appear regardless of metric before it
      const labels = await prometheusResourceClient.getLabels(
        dataset.id,
        suggestions.suggestLabels !== '' ? suggestions.suggestLabels : undefined
      );
      finalSuggestions.push(
        ...labels.map((af: string) => ({
          text: `${af}`,
          type: monaco.languages.CompletionItemKind.File,
          detail: SuggestionItemDetailsTags.Table,
        }))
      );
    }

    if (suggestions.suggestLabelValues && suggestions.suggestLabelValues.label) {
      // TODO: match what's already typed to the suggestion name so that it appears when being typed
      // TODO: update when we can get metric name passed in
      const labelValues = await prometheusResourceClient.getLabelValues(
        dataset.id,
        suggestions.suggestLabelValues.label
      );
      finalSuggestions.push(
        ...labelValues.map((af: string) => ({
          text: `${af}`,
          type: monaco.languages.CompletionItemKind.File,
          detail: SuggestionItemDetailsTags.Table,
        }))
      );
    }

    if (suggestions.suggestTimeRangeUnits && lineNumber && column) {
      finalSuggestions.push(
        ...['ms', 's', 'm', 'h', 'd', 'w', 'y'].map((af) => ({
          text: `${af}`,
          type: monaco.languages.CompletionItemKind.Constant,
          detail: SuggestionItemDetailsTags.Command,
          replacePosition: new monaco.Range(lineNumber, column, lineNumber, column), // remove duration token association
        }))
      );
    }

    if (suggestions.suggestKeywords?.length) {
      finalSuggestions.push(
        ...suggestions.suggestKeywords.map((sk) => ({
          text: sk.value,
          type: monaco.languages.CompletionItemKind.Keyword,
          insertText: `${sk.value}`,
          detail: SuggestionItemDetailsTags.Keyword,
        }))
      );
    }

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
