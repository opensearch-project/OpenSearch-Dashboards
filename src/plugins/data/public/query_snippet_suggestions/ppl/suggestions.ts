/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { QuerySuggestion } from '../../autocomplete';
import { QuerySnippetItem } from '../types';
import { getUserPastQueries } from '../utils';

const languageId = 'PPL';

export const extractSnippetsFromQuery = (query: string) => {
  const pplQuerySegments = query.split('|');

  return pplQuerySegments;
};

export const convertQueryToMonacoSuggestion = (
  queries: QuerySnippetItem[],
  userQuery: string
): QuerySuggestion[] => {
  const textMap = new Map<string, QuerySuggestion>();

  queries.forEach((query) => {
    // Process each query to create Monaco suggestions
    const snippets = extractSnippetsFromQuery(query.query.query as string);
    snippets.forEach((snippet) => {
      const trimmedSnippet = snippet.trim().toLowerCase();

      // Only add if we haven't seen this text before
      if (!textMap.has(trimmedSnippet)) {
        textMap.set(trimmedSnippet, {
          text: trimmedSnippet,
          type: monaco.languages.CompletionItemKind.Reference,
          detail: `${query.source} Snippet`,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule?.InsertAsSnippet,
          // sortText is the only option to sort suggestions, compares strings
          sortText: '0',
          documentation: `Derived From:\n\`\`\`ppl\n${query.query.query}\n\`\`\``,
        });
      }
    });
  });

  return Array.from(textMap.values());
};

export const getPPLQuerySnippetForSuggestions = async (
  userQuery: string
): Promise<QuerySuggestion[]> => {
  // Fetfch all User Queries
  const userQueries = await getUserPastQueries(languageId);

  const suggestions = convertQueryToMonacoSuggestion(userQueries, userQuery);

  // Extract the last Segment from the query
  const userQuerySegments = userQuery.split('|');
  const currentUserQuerySegment = userQuerySegments.pop()?.trim().toLowerCase();

  // Using currentUserQuery to do a prefix filtering of the Query Segments
  if (currentUserQuerySegment) {
    return suggestions
      .filter((suggestion) => {
        return (
          suggestion.text.startsWith(currentUserQuerySegment) &&
          currentUserQuerySegment !== suggestion.text
        );
      })
      .map((suggestion) => ({
        ...suggestion,
        insertText: suggestion.text.slice(currentUserQuerySegment.length).trim() + ' ',
      }));
  }

  return [];
};
