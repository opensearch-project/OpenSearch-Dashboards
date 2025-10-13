/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import {
  getPPLQuerySnippetForSuggestions,
  convertQueryToMonacoSuggestion,
  extractSnippetsFromQuery,
} from './suggestions';
import { getUserPastQueries } from '../utils';
import { QuerySnippetItem } from '../types';

jest.mock('../utils');

const mockGetUserPastQueries = getUserPastQueries as jest.MockedFunction<typeof getUserPastQueries>;

describe('PPL Query Snippet Suggestions', () => {
  const mockQueries: QuerySnippetItem[] = [
    {
      id: '1',
      query: {
        query: 'source = logs | where status = "error" | stats count() by host',
        language: 'PPL',
      },
      title: 'Error logs by host',
      source: 'Saved Query',
    },
    {
      id: '2',
      query: {
        query: 'source = metrics | fields timestamp, cpu_usage | sort timestamp desc',
        language: 'PPL',
      },
      title: 'CPU metrics',
      source: 'Recent Query',
    },
    {
      id: '3',
      query: {
        query: 'source = traces | where service = "api" | head 100',
        language: 'PPL',
      },
      source: 'Saved Search',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserPastQueries.mockResolvedValue(mockQueries);
  });

  describe('extractSnippetsFromQuery', () => {
    it('should split query by pipe separator', () => {
      const query = 'source = logs | where status = "error" | stats count() by host';
      const result = extractSnippetsFromQuery(query);

      expect(result).toEqual([
        'source = logs ',
        ' where status = "error" ',
        ' stats count() by host',
      ]);
    });

    it('should handle query without pipes', () => {
      const query = 'source = logs';
      const result = extractSnippetsFromQuery(query);

      expect(result).toEqual(['source = logs']);
    });

    it('should handle empty query', () => {
      const query = '';
      const result = extractSnippetsFromQuery(query);

      expect(result).toEqual(['']);
    });
  });

  describe('convertQueryToMonacoSuggestion', () => {
    it('should convert queries to Monaco suggestions without user query', () => {
      const result = convertQueryToMonacoSuggestion(mockQueries, '');

      expect(result).toHaveLength(9); // 3 queries with 3, 3, 3 segments each

      // Check first suggestion
      expect(result).toContainEqual(
        expect.objectContaining({
          text: 'source = logs',
          type: monaco.languages.CompletionItemKind.Reference,
          detail: 'Saved Query Snippet',
          sortText: '0',
          documentation: expect.stringContaining(
            'source = logs | where status = "error" | stats count() by host'
          ),
        })
      );
    });

    it('should convert queries to Monaco suggestions with user query', () => {
      const result = convertQueryToMonacoSuggestion(mockQueries, 'source = logs | ');

      expect(result).toHaveLength(9);

      // Check that suggestions don't have insertText in base conversion
      const firstSuggestion = result.find((s) => s.text === 'source = logs');
      expect(firstSuggestion?.insertText).toBeUndefined();
    });

    it('should deduplicate identical snippets', () => {
      const duplicateQueries: QuerySnippetItem[] = [
        {
          id: '1',
          query: { query: 'source = logs | where status = "error"', language: 'PPL' },
          source: 'Saved Query',
        },
        {
          id: '2',
          query: { query: 'source = logs | where status = "error"', language: 'PPL' },
          source: 'Recent Query',
        },
      ];

      const result = convertQueryToMonacoSuggestion(duplicateQueries, '');

      // Should only have 2 unique suggestions (source = logs, where status = "error")
      expect(result).toHaveLength(2);
    });
  });

  describe('getPPLQuerySnippetForSuggestions', () => {
    it('should return all suggestions when user query is empty', async () => {
      const result = await getPPLQuerySnippetForSuggestions('');

      expect(mockGetUserPastQueries).toHaveBeenCalledWith('PPL');
      expect(result).toHaveLength(0);
    });

    it('should filter suggestions based on current query segment', async () => {
      const result = await getPPLQuerySnippetForSuggestions('source = logs | whe');

      const whereResult = result.find((s) => s.text.startsWith('where'));
      expect(whereResult).toBeDefined();
      expect(whereResult?.insertText).toBe('re status = "error" '); // Should complete "whe" to "where status = "error"" with trailing space
    });

    it('should return empty array when no matching suggestions', async () => {
      const result = await getPPLQuerySnippetForSuggestions('source = logs | xyz');

      expect(result).toHaveLength(0);
    });

    it('should handle queries with multiple pipe segments', async () => {
      const result = await getPPLQuerySnippetForSuggestions(
        'source = logs | where status = "error" | st'
      );

      const statsResult = result.find((s) => s.text.startsWith('stats'));
      expect(statsResult).toBeDefined();
      expect(statsResult?.insertText).toBe('ats count() by host ');
    });

    it('should not return suggestions that match exactly', async () => {
      const result = await getPPLQuerySnippetForSuggestions(
        'source = logs | where status = "error"'
      );

      // Should not include exact matches
      expect(result.find((s) => s.text === 'where status = "error"')).toBeUndefined();
    });

    it('should handle empty current segment', async () => {
      const result = await getPPLQuerySnippetForSuggestions('source = logs | ');

      expect(result).toHaveLength(0); // Should return empty array when current segment is empty after pipe
    });

    it('should be case insensitive', async () => {
      const result = await getPPLQuerySnippetForSuggestions('source = logs | WHERE');

      const whereResult = result.find((s) => s.text.startsWith('where'));
      expect(whereResult).toBeDefined();
    });

    it('should handle getUserPastQueries returning empty array', async () => {
      mockGetUserPastQueries.mockResolvedValue([]);

      const result = await getPPLQuerySnippetForSuggestions('source = logs | whe');

      expect(result).toHaveLength(0);
    });
  });
});
