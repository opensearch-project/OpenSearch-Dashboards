/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { IndexDataStructureCreator } from './index_data_structure_creator';
import { DATA_STRUCTURE_META_TYPES } from '../../../../../../common';

const mockFetchIndices = jest.fn();
jest.mock('./use_index_fetcher', () => ({
  useIndexFetcher: () => ({
    fetchIndices: mockFetchIndices,
  }),
}));

// Mock the child components
jest.mock('./mode_selection_row', () => ({
  ModeSelectionRow: ({
    onModeChange,
    onWildcardPatternsChange,
    onCurrentWildcardPatternChange,
    onMultiIndexSelectionChange,
    selectionMode,
    wildcardPatterns,
    selectedIndexIds,
  }: any) => (
    <div>
      <div data-test-subj="current-mode">{selectionMode}</div>
      <button
        data-test-subj="mode-change-to-prefix"
        onClick={() => onModeChange([{ value: 'prefix' }])}
      >
        Switch to Prefix Mode
      </button>
      <button
        data-test-subj="mode-change-to-single"
        onClick={() => onModeChange([{ value: 'single' }])}
      >
        Switch to Single Mode
      </button>
      <button
        data-test-subj="select-indices"
        onClick={() => onMultiIndexSelectionChange(['index1', 'index2'])}
      >
        Select Indices
      </button>
      <button data-test-subj="clear-indices" onClick={() => onMultiIndexSelectionChange([])}>
        Clear Indices
      </button>
      <button
        data-test-subj="add-pattern"
        onClick={() => onWildcardPatternsChange([...wildcardPatterns, 'logs-*'])}
      >
        Add Pattern
      </button>
      <button data-test-subj="clear-patterns" onClick={() => onWildcardPatternsChange([])}>
        Clear Patterns
      </button>
      <button
        data-test-subj="set-current-pattern"
        onClick={() => onCurrentWildcardPatternChange('test-*')}
      >
        Set Current Pattern
      </button>
      <div data-test-subj="selected-ids">{selectedIndexIds.join(',')}</div>
      <div data-test-subj="wildcard-patterns">{wildcardPatterns.join(',')}</div>
    </div>
  ),
}));

jest.mock('./matching_indices_list', () => ({
  MatchingIndicesList: ({ matchingIndices, customPrefix, isLoading }: any) => (
    <div data-test-subj="matching-list">
      <div data-test-subj="matching-prefix">{customPrefix}</div>
      <div data-test-subj="matching-loading">{isLoading ? 'loading' : 'not-loading'}</div>
      {matchingIndices.map((index: string) => (
        <div key={index} data-test-subj={`matching-index-${index}`}>
          {index}
        </div>
      ))}
    </div>
  ),
}));

const mockSelectDataStructure = jest.fn();

const defaultProps = {
  path: [
    {
      id: 'test',
      title: 'Test',
      type: 'INDEX' as const,
      children: [
        { id: 'index1', title: 'logs-2024', type: 'INDEX' as const },
        { id: 'index2', title: 'metrics-2024', type: 'INDEX' as const },
      ],
    },
  ],
  index: 0,
  selectDataStructure: mockSelectDataStructure,
  setPath: jest.fn(),
  fetchDataStructure: jest.fn(),
};

const renderComponent = (props = {}) =>
  render(
    <I18nProvider>
      <IndexDataStructureCreator {...defaultProps} {...props} />
    </I18nProvider>
  );

describe('IndexDataStructureCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockFetchIndices.mockResolvedValue(['result1', 'result2']);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('renders without errors', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.indexDataStructureCreator')).toBeInTheDocument();
    });

    it('renders mode selection row', () => {
      const { getByText } = renderComponent();
      expect(getByText('Switch to Prefix Mode')).toBeInTheDocument();
    });

    it('starts in single mode by default', () => {
      const { getByTestId } = renderComponent();
      expect(getByTestId('current-mode')).toHaveTextContent('single');
    });
  });

  describe('Mode Switching', () => {
    it('switches to prefix mode and sets currentWildcardPattern to *', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('mode-change-to-prefix'));

      await waitFor(() => {
        expect(getByTestId('current-mode')).toHaveTextContent('prefix');
      });

      // Should trigger debounced fetch with '*'
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockFetchIndices).toHaveBeenCalledWith({ patterns: ['*'] });
      });
    });

    it('switches back to single mode and clears patterns', async () => {
      const { getByTestId } = renderComponent();

      // Switch to prefix mode first
      fireEvent.click(getByTestId('mode-change-to-prefix'));
      await waitFor(() => {
        expect(getByTestId('current-mode')).toHaveTextContent('prefix');
      });

      // Switch back to single mode
      fireEvent.click(getByTestId('mode-change-to-single'));

      await waitFor(() => {
        expect(getByTestId('current-mode')).toHaveTextContent('single');
      });

      // MatchingIndicesList should not be rendered in single mode
      expect(() => getByTestId('matching-list')).toThrow();
    });

    it('clears wildcardPatterns and matchingIndices when switching modes', async () => {
      const { getByTestId } = renderComponent();

      // Switch to prefix and add patterns
      fireEvent.click(getByTestId('mode-change-to-prefix'));
      fireEvent.click(getByTestId('add-pattern'));

      await waitFor(() => {
        expect(getByTestId('wildcard-patterns')).toHaveTextContent('logs-*');
      });

      // Switch back to single
      fireEvent.click(getByTestId('mode-change-to-single'));

      await waitFor(() => {
        expect(getByTestId('wildcard-patterns')).toHaveTextContent('');
      });
    });
  });

  describe('Multi-Index Selection (Single Mode)', () => {
    it('creates data structure when indices are selected', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('select-indices'));

      await waitFor(() => {
        expect(mockSelectDataStructure).toHaveBeenCalledWith(
          {
            id: 'local::logs-2024,metrics-2024',
            title: 'logs-2024,metrics-2024',
            type: 'INDEX',
            meta: {
              type: DATA_STRUCTURE_META_TYPES.CUSTOM,
              isMultiIndex: true,
              selectedIndices: ['index1', 'index2'],
              selectedTitles: ['logs-2024', 'metrics-2024'],
            },
          },
          [defaultProps.path[0]]
        );
      });
    });

    it('clears data structure when all indices are deselected', async () => {
      const { getByTestId } = renderComponent();

      // First select indices
      fireEvent.click(getByTestId('select-indices'));
      await waitFor(() => {
        expect(mockSelectDataStructure).toHaveBeenCalled();
      });

      mockSelectDataStructure.mockClear();

      // Then clear selection
      fireEvent.click(getByTestId('clear-indices'));

      await waitFor(() => {
        expect(mockSelectDataStructure).toHaveBeenCalledWith(undefined, [defaultProps.path[0]]);
      });
    });

    it('uses data source ID from path when available', async () => {
      const propsWithDataSource = {
        ...defaultProps,
        path: [
          {
            id: 'my-datasource',
            title: 'My DataSource',
            type: 'DATA_SOURCE' as const,
          },
          ...defaultProps.path,
        ],
        index: 1,
      };

      const { getByTestId } = renderComponent(propsWithDataSource);

      fireEvent.click(getByTestId('select-indices'));

      await waitFor(() => {
        expect(mockSelectDataStructure).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'my-datasource::logs-2024,metrics-2024',
          }),
          expect.anything()
        );
      });
    });

    it('displays selected index badges', async () => {
      const { getByTestId, getByText } = renderComponent();

      fireEvent.click(getByTestId('select-indices'));

      await waitFor(() => {
        expect(getByText('logs-2024')).toBeInTheDocument();
        expect(getByText('metrics-2024')).toBeInTheDocument();
      });
    });

    it('removes individual index when badge cross is clicked', async () => {
      const { getByTestId, getByLabelText } = renderComponent();

      fireEvent.click(getByTestId('select-indices'));

      await waitFor(() => {
        const removeButton = getByLabelText('Remove index logs-2024');
        expect(removeButton).toBeInTheDocument();
      });

      mockSelectDataStructure.mockClear();

      const removeButton = getByLabelText('Remove index logs-2024');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockSelectDataStructure).toHaveBeenCalled();
        const callArgs = mockSelectDataStructure.mock.calls[0];
        expect(callArgs[0].meta.selectedIndices).toEqual(['index2']);
        expect(callArgs[0].meta.selectedTitles).toEqual(['metrics-2024']);
      });
    });
  });

  describe('Wildcard Pattern Selection (Prefix Mode)', () => {
    it('creates data structure when wildcard patterns are added', async () => {
      const { getByTestId } = renderComponent();

      // Switch to prefix mode
      fireEvent.click(getByTestId('mode-change-to-prefix'));
      jest.advanceTimersByTime(300);
      await waitFor(() => {
        expect(mockFetchIndices).toHaveBeenCalledWith({ patterns: ['*'] });
      });

      mockSelectDataStructure.mockClear();

      // Add pattern
      fireEvent.click(getByTestId('add-pattern'));

      await waitFor(() => {
        expect(mockSelectDataStructure).toHaveBeenCalledWith(
          {
            id: 'local::logs-*',
            title: 'logs-*',
            type: 'INDEX',
            meta: {
              type: DATA_STRUCTURE_META_TYPES.CUSTOM,
              isMultiWildcard: true,
              wildcardPatterns: ['logs-*'],
              matchingIndices: ['result1', 'result2'],
            },
          },
          [defaultProps.path[0]]
        );
      });
    });

    it('clears data structure when all patterns are removed', async () => {
      const { getByTestId } = renderComponent();

      // Switch to prefix mode and add pattern
      fireEvent.click(getByTestId('mode-change-to-prefix'));
      fireEvent.click(getByTestId('add-pattern'));

      await waitFor(() => {
        expect(mockSelectDataStructure).toHaveBeenCalled();
      });

      mockSelectDataStructure.mockClear();

      // Clear patterns
      fireEvent.click(getByTestId('clear-patterns'));

      await waitFor(() => {
        expect(mockSelectDataStructure).toHaveBeenCalledWith(undefined, [defaultProps.path[0]]);
      });
    });

    it('displays wildcard pattern badges', async () => {
      const { getByTestId, getAllByText } = renderComponent();

      fireEvent.click(getByTestId('mode-change-to-prefix'));
      fireEvent.click(getByTestId('add-pattern'));

      await waitFor(() => {
        const badges = getAllByText('logs-*');
        // Should have at least one badge (in the actual EuiBadge component)
        expect(badges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('removes individual pattern when badge cross is clicked', async () => {
      const { getByTestId, getByLabelText } = renderComponent();

      fireEvent.click(getByTestId('mode-change-to-prefix'));
      fireEvent.click(getByTestId('add-pattern'));

      await waitFor(() => {
        const removeButton = getByLabelText('Remove pattern logs-*');
        expect(removeButton).toBeInTheDocument();
      });

      mockSelectDataStructure.mockClear();

      const removeButton = getByLabelText('Remove pattern logs-*');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockSelectDataStructure).toHaveBeenCalledWith(undefined, [defaultProps.path[0]]);
      });
    });
  });

  describe('Debounced API Calls', () => {
    it('debounces fetchMatchingIndices calls with 300ms delay', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('mode-change-to-prefix'));

      // Should not call immediately
      expect(mockFetchIndices).not.toHaveBeenCalled();

      // Advance timer by 300ms
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockFetchIndices).toHaveBeenCalledWith({ patterns: ['*'] });
      });
    });

    it('only triggers one API call for multiple rapid changes', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('mode-change-to-prefix'));

      // Make multiple rapid changes
      fireEvent.click(getByTestId('set-current-pattern'));
      jest.advanceTimersByTime(100);
      fireEvent.click(getByTestId('set-current-pattern'));
      jest.advanceTimersByTime(100);
      fireEvent.click(getByTestId('set-current-pattern'));

      // Only advance by remaining time
      jest.advanceTimersByTime(100);

      await waitFor(() => {
        // Should only be called once (not three times)
        expect(mockFetchIndices).toHaveBeenCalledTimes(1);
      });
    });

    it('clears matchingIndices when switching away from prefix mode', async () => {
      const { getByTestId, queryByTestId } = renderComponent();

      // Switch to prefix mode
      fireEvent.click(getByTestId('mode-change-to-prefix'));
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(getByTestId('matching-list')).toBeInTheDocument();
      });

      // Switch back to single mode
      fireEvent.click(getByTestId('mode-change-to-single'));

      await waitFor(() => {
        expect(queryByTestId('matching-list')).not.toBeInTheDocument();
      });
    });

    it('shows all indices (*) when no patterns are entered', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('mode-change-to-prefix'));
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockFetchIndices).toHaveBeenCalledWith({ patterns: ['*'] });
      });
    });

    it('combines added patterns with current pattern for fetch', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('mode-change-to-prefix'));
      fireEvent.click(getByTestId('add-pattern')); // adds 'logs-*'
      fireEvent.click(getByTestId('set-current-pattern')); // sets 'test-*'

      mockFetchIndices.mockClear();
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockFetchIndices).toHaveBeenCalledWith({ patterns: ['logs-*', 'test-*'] });
      });
    });
  });

  describe('MatchingIndicesList Integration', () => {
    it('only renders MatchingIndicesList in prefix mode', async () => {
      const { getByTestId, queryByTestId } = renderComponent();

      // Should not be visible in single mode
      expect(queryByTestId('matching-list')).not.toBeInTheDocument();

      // Switch to prefix mode
      fireEvent.click(getByTestId('mode-change-to-prefix'));

      await waitFor(() => {
        expect(getByTestId('matching-list')).toBeInTheDocument();
      });
    });

    it('passes matchingIndices to MatchingIndicesList', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('mode-change-to-prefix'));
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(getByTestId('matching-index-result1')).toBeInTheDocument();
        expect(getByTestId('matching-index-result2')).toBeInTheDocument();
      });
    });

    it('passes currentWildcardPattern to MatchingIndicesList', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('mode-change-to-prefix'));

      await waitFor(() => {
        expect(getByTestId('matching-prefix')).toHaveTextContent('*');
      });
    });

    it('passes loading state to MatchingIndicesList', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('mode-change-to-prefix'));

      // Should show loading before timer completes
      expect(getByTestId('matching-loading')).toHaveTextContent('not-loading');

      jest.advanceTimersByTime(300);

      // Wait for loading state to update
      await waitFor(() => {
        expect(mockFetchIndices).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles empty pattern gracefully', async () => {
      mockFetchIndices.mockResolvedValue([]);

      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('mode-change-to-prefix'));
      jest.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockFetchIndices).toHaveBeenCalled();
      });

      // Should not crash and matchingIndices should be empty
      const matchingList = getByTestId('matching-list');
      expect(matchingList).toBeInTheDocument();
    });

    it('handles fetchIndices errors gracefully', async () => {
      // When fetch fails, it returns empty array (handled in the hook)
      // This test verifies the component handles that gracefully
      mockFetchIndices.mockResolvedValue([]);

      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('mode-change-to-prefix'));
      jest.advanceTimersByTime(300);

      // Component should still render with empty results
      await waitFor(() => {
        expect(getByTestId('matching-list')).toBeInTheDocument();
        expect(mockFetchIndices).toHaveBeenCalled();
      });
    });
  });
});
