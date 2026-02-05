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

// Mock the UnifiedIndexSelector component
jest.mock('./unified_index_selector', () => ({
  UnifiedIndexSelector: ({ selectedItems, onSelectionChange }: any) => (
    <div>
      <div data-test-subj="unified-selector">Unified Index Selector</div>
      <div data-test-subj="selected-count">{selectedItems.length}</div>
      <button
        data-test-subj="add-single-index"
        onClick={() =>
          onSelectionChange([
            ...selectedItems,
            { id: 'test::index1', title: 'index1', isWildcard: false },
          ])
        }
      >
        Add Single Index
      </button>
      <button
        data-test-subj="add-wildcard"
        onClick={() =>
          onSelectionChange([
            ...selectedItems,
            { id: 'test::logs-*', title: 'logs-*', isWildcard: true },
          ])
        }
      >
        Add Wildcard
      </button>
      <button data-test-subj="clear-selection" onClick={() => onSelectionChange([])}>
        Clear Selection
      </button>
      <div data-test-subj="selected-items">
        {selectedItems.map((item: any) => (
          <div key={item.id} data-test-subj={`selected-item-${item.title}`}>
            {item.title} ({item.isWildcard ? 'wildcard' : 'single'})
          </div>
        ))}
      </div>
    </div>
  ),
}));

const mockSelectDataStructure = jest.fn();
const mockHttp = {
  get: jest.fn().mockResolvedValue([
    {
      health: 'green',
      status: 'open',
      index: 'test-index',
      'docs.count': '1000',
      'store.size': '1mb',
    },
  ]),
};

const defaultProps = {
  path: [
    {
      id: 'test',
      title: 'Test',
      type: 'DATA_SOURCE' as const,
    },
  ],
  index: 0,
  selectDataStructure: mockSelectDataStructure,
  services: {
    http: mockHttp,
  } as any,
};

const renderComponent = (props = {}) =>
  render(
    <I18nProvider>
      {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
      <IndexDataStructureCreator {...defaultProps} {...props} />
    </I18nProvider>
  );

describe('IndexDataStructureCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchIndices.mockResolvedValue(['index1', 'index2', 'logs-2024']);
  });

  describe('Basic Rendering', () => {
    it('renders without errors', () => {
      const { container } = renderComponent();
      expect(container.querySelector('.indexDataStructureCreator')).toBeInTheDocument();
    });

    it('renders unified index selector', () => {
      const { getByTestId } = renderComponent();
      expect(getByTestId('unified-selector')).toBeInTheDocument();
    });

    it('starts with no selected items', () => {
      const { getByTestId } = renderComponent();
      expect(getByTestId('selected-count')).toHaveTextContent('0');
    });
  });

  describe('Single Index Selection', () => {
    it('handles single index selection', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('add-single-index'));

      await waitFor(() => {
        expect(getByTestId('selected-count')).toHaveTextContent('1');
        expect(getByTestId('selected-item-index1')).toHaveTextContent('index1 (single)');
      });

      expect(mockSelectDataStructure).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test::index1',
          title: 'index1',
          type: 'INDEX',
          meta: expect.objectContaining({
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
            isMultiIndex: true,
            selectedIndices: ['test::index1'],
            selectedTitles: ['index1'],
          }),
        }),
        expect.any(Array)
      );
    });

    it('handles multiple single index selections', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('add-single-index'));
      fireEvent.click(getByTestId('add-single-index'));

      await waitFor(() => {
        expect(getByTestId('selected-count')).toHaveTextContent('2');
      });
    });

    it('clears selection', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('add-single-index'));
      await waitFor(() => {
        expect(getByTestId('selected-count')).toHaveTextContent('1');
      });

      fireEvent.click(getByTestId('clear-selection'));

      await waitFor(() => {
        expect(getByTestId('selected-count')).toHaveTextContent('0');
      });

      expect(mockSelectDataStructure).toHaveBeenCalledWith(undefined, expect.any(Array));
    });
  });

  describe('Wildcard Pattern Selection', () => {
    it('handles wildcard pattern selection', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('add-wildcard'));

      await waitFor(() => {
        expect(getByTestId('selected-count')).toHaveTextContent('1');
        expect(getByTestId('selected-item-logs-*')).toHaveTextContent('logs-* (wildcard)');
      });

      expect(mockSelectDataStructure).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test::logs-*',
          title: 'logs-*',
          type: 'INDEX',
          meta: expect.objectContaining({
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
            isMultiWildcard: true,
            wildcardPatterns: ['logs-*'],
          }),
        }),
        expect.any(Array)
      );
    });
  });

  describe('Mixed Selection (Single + Wildcard)', () => {
    it('handles mixed selection of single indices and wildcards', async () => {
      // @ts-expect-error TS6133 TODO(ts-error): fixme
      const mockOnSelectionChange = jest.fn();
      const { getByTestId } = renderComponent();

      // Add single index first
      fireEvent.click(getByTestId('add-single-index'));

      await waitFor(() => {
        expect(getByTestId('selected-count')).toHaveTextContent('1');
      });

      // Add wildcard
      fireEvent.click(getByTestId('add-wildcard'));

      await waitFor(() => {
        expect(getByTestId('selected-count')).toHaveTextContent('2');
      });

      expect(mockSelectDataStructure).toHaveBeenLastCalledWith(
        expect.objectContaining({
          title: 'index1,logs-*',
          meta: expect.objectContaining({
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
            isMultiWildcard: true,
            wildcardPatterns: ['logs-*'],
            selectedIndices: ['test::index1'],
            selectedTitles: ['index1'],
          }),
        }),
        expect.any(Array)
      );
    });
  });

  describe('Health Data Fetching', () => {
    it('fetches health data when exact index is selected', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('add-single-index'));

      await waitFor(() => {
        expect(mockHttp.get).toHaveBeenCalledWith(
          '/api/directquery/dsl/cat.indices/dataSourceMDSId=test',
          expect.objectContaining({
            query: expect.objectContaining({
              format: 'json',
              index: 'index1',
            }),
          })
        );
      });
    });

    it('handles health data fetch errors gracefully', async () => {
      mockHttp.get.mockRejectedValueOnce(new Error('Network error'));
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('add-single-index'));

      await waitFor(() => {
        expect(mockHttp.get).toHaveBeenCalled();
      });

      // Component should still work after error
      expect(getByTestId('selected-count')).toHaveTextContent('1');
    });

    it('includes dataSourceId in URL path when present', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('add-single-index'));

      await waitFor(() => {
        expect(mockHttp.get).toHaveBeenCalledWith(
          '/api/directquery/dsl/cat.indices/dataSourceMDSId=test',
          expect.objectContaining({
            query: expect.objectContaining({
              format: 'json',
              index: 'index1',
            }),
          })
        );
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state message when no items selected', () => {
      const { getByText } = renderComponent();
      expect(getByText(/No indices or patterns selected yet/i)).toBeInTheDocument();
    });

    it('hides empty state when items are selected', async () => {
      const { getByTestId, queryByText } = renderComponent();

      fireEvent.click(getByTestId('add-single-index'));

      await waitFor(() => {
        expect(queryByText(/No indices or patterns selected yet/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Source Handling', () => {
    it('uses local as default when no data source in path', async () => {
      const { getByTestId } = renderComponent({
        path: [],
      });

      fireEvent.click(getByTestId('add-single-index'));

      await waitFor(() => {
        expect(mockSelectDataStructure).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'local::index1',
          }),
          expect.any(Array)
        );
      });
    });

    it('uses data source id from path when present', async () => {
      const { getByTestId } = renderComponent();

      fireEvent.click(getByTestId('add-single-index'));

      await waitFor(() => {
        expect(mockSelectDataStructure).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'test::index1',
          }),
          expect.any(Array)
        );
      });
    });
  });

  describe('Services Prop', () => {
    it('renders without services prop', () => {
      const { container } = renderComponent({
        services: undefined,
      });
      expect(container.querySelector('.indexDataStructureCreator')).toBeInTheDocument();
    });
  });
});
