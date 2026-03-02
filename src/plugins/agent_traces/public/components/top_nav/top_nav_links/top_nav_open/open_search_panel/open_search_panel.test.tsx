/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpenSearchPanel } from './open_search_panel';

// Mock services
const mockOnClose = jest.fn();
const mockNavigateToApp = jest.fn();
const mockNavigateToUrl = jest.fn();
const mockSetAppFilters = jest.fn();
const mockClearQuery = jest.fn();
const mockDispatch = jest.fn();

jest.mock('../../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(() => ({
    services: {
      core: {
        uiSettings: {
          get: jest.fn(() => false),
        },
        savedObjects: {},
        application: {
          navigateToApp: mockNavigateToApp,
          navigateToUrl: mockNavigateToUrl,
          getUrlForApp: jest.fn((app, options) => `/app/${app}${options?.path || ''}`),
        },
      },
      addBasePath: jest.fn((path) => path),
      data: {
        query: {
          queryString: {
            clearQuery: mockClearQuery,
          },
        },
      },
      filterManager: {
        setAppFilters: mockSetAppFilters,
      },
      store: {
        dispatch: mockDispatch,
      },
    },
  })),
}));

// Mock SavedObjectFinderUi
jest.mock('../../../../../../../saved_objects/public', () => ({
  SavedObjectFinderUi: ({ onChoose }: any) => (
    <div data-test-subj="savedObjectFinder">
      <button
        onClick={() => onChoose('test-search-id', 'search', null, { attributes: {} })}
        data-test-subj="choose-search"
      >
        Choose Search
      </button>
      <button
        onClick={() =>
          onChoose('test-agentTraces-id', 'agentTraces', null, {
            attributes: { type: 'logs' },
          })
        }
        data-test-subj="choose-agentic-observability"
      >
        Choose Agent Traces
      </button>
    </div>
  ),
}));

describe('OpenSearchPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders flyout with header and footer', () => {
    render(<OpenSearchPanel onClose={mockOnClose} />);

    expect(screen.getByTestId('loadSearchForm')).toBeInTheDocument();
    expect(screen.getByText('Select Saved Search')).toBeInTheDocument();
    expect(screen.getByText('Manage searches')).toBeInTheDocument();
  });

  it('renders SavedObjectFinderUi', () => {
    render(<OpenSearchPanel onClose={mockOnClose} />);

    expect(screen.getByTestId('savedObjectFinder')).toBeInTheDocument();
  });

  it('handles search selection and navigates to discover', () => {
    render(<OpenSearchPanel onClose={mockOnClose} />);

    fireEvent.click(screen.getByTestId('choose-search'));

    expect(mockSetAppFilters).toHaveBeenCalledWith([]);
    expect(mockClearQuery).toHaveBeenCalled();
    expect(mockNavigateToApp).toHaveBeenCalledWith('discover', { path: '#/view/test-search-id' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles agent traces selection and navigates', () => {
    render(<OpenSearchPanel onClose={mockOnClose} />);

    fireEvent.click(screen.getByTestId('choose-agentic-observability'));

    expect(mockSetAppFilters).toHaveBeenCalledWith([]);
    expect(mockClearQuery).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'logs/incrementSaveAgentTracesLoadCount',
    });
    expect(mockNavigateToUrl).toHaveBeenCalledWith(
      '/app/agentTraces/logs#/view/test-agentTraces-id'
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes flyout when close button is clicked', () => {
    render(<OpenSearchPanel onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Manage searches'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
