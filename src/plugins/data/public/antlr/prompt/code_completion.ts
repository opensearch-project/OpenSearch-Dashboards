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

import { OpenSearchPPLParser } from '@osd/antlr-grammar';
import { monaco } from 'react-monaco-editor';
import {
  fetchColumnValues,
  formatAvailableFieldsToSuggestions,
  formatValuesToSuggestions,
} from '../shared/utils';

import { QuerySuggestion, QuerySuggestionGetFnArgs } from '../../autocomplete';
import { IndexPatternField } from '../../index_patterns';
import { Documentation } from '../opensearch_ppl/ppl_documentation';
import { KEYWORD_ITEM_KIND_MAP, PPL_SUGGESTION_IMPORTANCE } from '../opensearch_ppl/constants';
import { SuggestionItemDetailsTags } from '../shared/constants';

const extractField = (input: string): string | null => {
  const match = input.match(/\b([\w.]+)(?:\s*=|\s+(is|equals))\s*$/i);
  if (match) {
    return match[1]; // captured field name
  }
  return null;
};

const getLanguageSpecificCommands = (language: string | null | undefined): QuerySuggestion[] => {
  switch (language) {
    case 'PPL': {
      const pplCommandSuggestions = Object.keys(Documentation).map((key) => {
        const tokenId = (OpenSearchPPLParser as any)[key.toUpperCase()];
        const keywordDetails = PPL_SUGGESTION_IMPORTANCE.get(tokenId) ?? {
          importance: '9',
          type: SuggestionItemDetailsTags.Keyword,
        };
        return {
          text: key.toLowerCase(),
          type:
            KEYWORD_ITEM_KIND_MAP.get(keywordDetails.type) ??
            monaco.languages.CompletionItemKind.Keyword,
          insertText: `${key.toLowerCase()}`,
          detail: keywordDetails.type,
          sortText: keywordDetails.importance,
          documentation: Documentation[key] ?? '',
        };
      });

      return pplCommandSuggestions;
    }
    default:
      return [];
  }
};

export const getSuggestions = async ({
  selectionStart,
  selectionEnd,
  indexPattern,
  datasetType,
  position,
  query,
  services,
  baseLanguage,
}: QuerySuggestionGetFnArgs) => {
  if (!services || !services.appName || !indexPattern) return [];
  try {
    const finalSuggestions: QuerySuggestion[] = [];

    // Use query text up to cursor position for field extraction
    const queryUpToCursor = query.substring(0, selectionStart);
    const fieldName = extractField(queryUpToCursor);

    if (fieldName) {
      finalSuggestions.push(
        ...formatValuesToSuggestions(
          await fetchColumnValues(
            indexPattern.title,
            fieldName,
            services,
            indexPattern,
            datasetType
          ).catch(() => []),
          (val: any) => (typeof val === 'string' ? `"${val}"` : `${val}`)
        )
      );
    } else {
      // Adding Field Name Suggestions
      const initialFields = indexPattern.fields.filter(
        (idxField: IndexPatternField) => !idxField?.subType
      );

      finalSuggestions.push(
        ...formatAvailableFieldsToSuggestions(
          initialFields,
          (f: string) => `${f}=`,
          (f: string) => {
            return f.startsWith('_') ? `99` : `3`; // This devalues all the Field Names that start _ so that appear further down the autosuggest wizard
          }
        )
      );

      // Get Language Specific Command Suggestions
      const commandSuggestions = getLanguageSpecificCommands(baseLanguage);
      finalSuggestions.push(...commandSuggestions);
    }
    return finalSuggestions;
  } catch (e) {
    return [];
  }
};
