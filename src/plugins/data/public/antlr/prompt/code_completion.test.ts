/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { monaco } from '@osd/monaco';
import { getSuggestions } from './code_completion';
import { IndexPattern } from '../../index_patterns';
import { IDataPluginServices } from '../../types';
import { QuerySuggestion } from '../../autocomplete';
import * as utils from '../shared/utils';

// Mock the dependencies
jest.mock('../shared/utils');
jest.mock('../opensearch_ppl/ppl_documentation');
jest.mock('../opensearch_ppl/constants');

const mockIndexPattern = {
  title: 'test-index',
  fields: [
    { name: '_field5', type: 'string' },
    { name: 'field1', type: 'string' },
    { name: 'field2', type: 'number' },
    { name: 'field3', type: 'boolean' },
    { name: 'field4', type: 'string' },
  ],
} as IndexPattern;

const mockServices = {
  appName: 'test-app',
} as IDataPluginServices;

const mockPosition = {
  lineNumber: 1,
  column: 1,
} as monaco.Position;

describe('prompt code_completion', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock formatAvailableFieldsToSuggestions
    (utils.formatAvailableFieldsToSuggestions as jest.Mock).mockReturnValue([
      {
        text: 'field1',
        type: 'Field',
        detail: 'field1',
        sortText: '3',
      },
      {
        text: 'field2',
        type: 'Field',
        detail: 'field2',
        sortText: '3',
      },
    ]);

    // Mock formatValuesToSuggestions
    (utils.formatValuesToSuggestions as jest.Mock).mockReturnValue([
      {
        text: 'value1',
        type: 'Value',
        detail: 'value1',
        sortText: '5',
      },
    ]);

    // Mock fetchColumnValues
    (utils.fetchColumnValues as jest.Mock).mockResolvedValue(['value1', 'value2']);
  });

  const getPromptSuggestions = async (
    query: string,
    baseLanguage: string = 'PPL',
    position: monaco.Position = new monaco.Position(1, query.length + 1)
  ) => {
    return getSuggestions({
      query,
      indexPattern: mockIndexPattern,
      position,
      language: 'AI', // For prompt mode
      baseLanguage,
      selectionStart: query.length,
      selectionEnd: query.length,
      services: mockServices,
      datasetType: 'INDEX_PATTERN',
    });
  };

  const checkSuggestionsContain = (
    suggestions: QuerySuggestion[],
    expectedSuggestions: Array<{ text?: string; detail?: string; type?: string }>
  ) => {
    expectedSuggestions.forEach((expected) => {
      const found = suggestions.find((s) => {
        return (
          (!expected.text || s.text === expected.text) &&
          (!expected.detail || s.detail === expected.detail) &&
          (!expected.type || s.type === expected.type)
        );
      });
      expect(found).toBeDefined();
    });
  };

  describe('Field suggestions', () => {
    test('should return field suggestions when no field extraction is possible', async () => {
      const suggestions = await getPromptSuggestions('show me');

      expect(utils.formatAvailableFieldsToSuggestions).toHaveBeenCalled();
      checkSuggestionsContain(suggestions, [
        { text: 'field1', type: 'Field' },
        { text: 'field2', type: 'Field' },
      ]);
    });

    test('should prioritize non-underscore fields', async () => {
      const suggestions = await getPromptSuggestions('find');

      expect(utils.formatAvailableFieldsToSuggestions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'field1' }),
          expect.objectContaining({ name: 'field2' }),
          expect.objectContaining({ name: 'field3' }),
          expect.objectContaining({ name: 'field4' }),
          expect.objectContaining({ name: '_field5' }),
        ]),
        expect.any(Function),
        expect.any(Function)
      );
    });
  });

  describe('Value suggestions', () => {
    test('should return value suggestions when field is extracted', async () => {
      const suggestions = await getPromptSuggestions('show me logs where field1 = ');

      expect(utils.fetchColumnValues).toHaveBeenCalledWith(
        'test-index',
        'field1',
        mockServices,
        mockIndexPattern,
        'INDEX_PATTERN'
      );

      checkSuggestionsContain(suggestions, [{ text: 'value1', type: 'Value' }]);
    });

    test('should extract field from "is" pattern', async () => {
      const suggestions = await getPromptSuggestions('give me logs where field2 is ');

      expect(utils.fetchColumnValues).toHaveBeenCalledWith(
        'test-index',
        'field2',
        mockServices,
        mockIndexPattern,
        'INDEX_PATTERN'
      );

      checkSuggestionsContain(suggestions, [{ text: 'value1', type: 'Value' }]);
    });

    test('should extract field from "equals" pattern', async () => {
      const suggestions = await getPromptSuggestions('find me the records where field3 equals ');

      expect(utils.fetchColumnValues).toHaveBeenCalledWith(
        'test-index',
        'field3',
        mockServices,
        mockIndexPattern,
        'INDEX_PATTERN'
      );

      checkSuggestionsContain(suggestions, [{ text: 'value1', type: 'Value' }]);
    });
  });

  describe('Language-specific commands', () => {
    test('should include PPL commands when baseLanguage is PPL', async () => {
      // Mock the Documentation and constants
      const mockDocumentation = { SEARCH: '# SEARCH command', STATS: '# STATS command' };
      const mockPPLSuggestionImportance = new Map([
        [1, { importance: '1', type: 'Command' }], // Mock token for SEARCH
        [2, { importance: '2', type: 'Command' }], // Mock token for STATS
      ]);

      jest.doMock('../opensearch_ppl/ppl_documentation', () => ({
        Documentation: mockDocumentation,
      }));
      jest.doMock('../opensearch_ppl/constants', () => ({
        PPL_SUGGESTION_IMPORTANCE: mockPPLSuggestionImportance,
        KEYWORD_ITEM_KIND_MAP: new Map(),
      }));

      const suggestions = await getPromptSuggestions('show me', 'PPL');

      // Should include both field suggestions and PPL commands
      expect(suggestions.length).toBeGreaterThan(2);
    });

    test('should not include PPL commands when baseLanguage is not PPL', async () => {
      const suggestions = await getPromptSuggestions('show me', 'SQL');

      // Should only include field suggestions, no PPL commands
      expect(utils.formatAvailableFieldsToSuggestions).toHaveBeenCalled();
      checkSuggestionsContain(suggestions, [
        { text: 'field1', type: 'Field' },
        { text: 'field2', type: 'Field' },
      ]);
    });
  });
});
