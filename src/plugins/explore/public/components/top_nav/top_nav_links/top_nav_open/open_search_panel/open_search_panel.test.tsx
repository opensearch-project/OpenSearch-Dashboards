/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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

// Mock SavedObjectFinderUi and capture props
let capturedSavedObjectMetaData: any;
jest.mock('../../../../../../../saved_objects/public', () => ({
  SavedObjectFinderUi: ({ onChoose, savedObjectMetaData }: any) => {
    capturedSavedObjectMetaData = savedObjectMetaData;
    return (
      <div data-test-subj="savedObjectFinder">
        <button
          onClick={() => onChoose('test-search-id', 'search', null, { attributes: {} })}
          data-test-subj="choose-search"
        >
          Choose Search
        </button>
        <button
          onClick={() =>
            onChoose('test-explore-id', 'explore', null, {
              attributes: { type: 'logs' },
            })
          }
          data-test-subj="choose-explore"
        >
          Choose Explore
        </button>
        <button
          onClick={() =>
            onChoose('test-explore-no-type', 'explore', null, {
              attributes: {},
            })
          }
          data-test-subj="choose-explore-no-type"
        >
          Choose Explore (No Type)
        </button>
      </div>
    );
  },
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

  it('handles explore selection and navigates to explore', () => {
    render(<OpenSearchPanel onClose={mockOnClose} />);

    fireEvent.click(screen.getByTestId('choose-explore'));

    expect(mockSetAppFilters).toHaveBeenCalledWith([]);
    expect(mockClearQuery).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'logs/incrementSaveExploreLoadCount' });
    expect(mockNavigateToUrl).toHaveBeenCalledWith('/app/explore/logs#/view/test-explore-id');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes flyout when close button is clicked', () => {
    render(<OpenSearchPanel onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Manage searches'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  describe('savedObjectMetadata filtering', () => {
    it('includes showSavedObject filter for explore type', () => {
      render(<OpenSearchPanel onClose={mockOnClose} />);

      expect(capturedSavedObjectMetaData).toBeDefined();
      expect(capturedSavedObjectMetaData).toHaveLength(2);

      const exploreMetadata = capturedSavedObjectMetaData.find(
        (meta: any) => meta.type === 'explore'
      );
      expect(exploreMetadata).toBeDefined();
      expect(exploreMetadata.showSavedObject).toBeDefined();
      expect(typeof exploreMetadata.showSavedObject).toBe('function');
    });

    it('showSavedObject returns true for explore with type attribute', () => {
      render(<OpenSearchPanel onClose={mockOnClose} />);

      const exploreMetadata = capturedSavedObjectMetaData.find(
        (meta: any) => meta.type === 'explore'
      );

      const savedObjectWithType = {
        attributes: { type: 'logs' },
      } as any;

      expect(exploreMetadata.showSavedObject(savedObjectWithType)).toBe(true);
    });

    it('showSavedObject returns false for explore without type attribute', () => {
      render(<OpenSearchPanel onClose={mockOnClose} />);

      const exploreMetadata = capturedSavedObjectMetaData.find(
        (meta: any) => meta.type === 'explore'
      );

      const savedObjectWithoutType = {
        attributes: {},
      } as any;

      expect(exploreMetadata.showSavedObject(savedObjectWithoutType)).toBe(false);
    });

    it('showSavedObject returns false for explore with undefined attributes', () => {
      render(<OpenSearchPanel onClose={mockOnClose} />);

      const exploreMetadata = capturedSavedObjectMetaData.find(
        (meta: any) => meta.type === 'explore'
      );

      const savedObjectWithoutAttributes = {} as any;

      expect(exploreMetadata.showSavedObject(savedObjectWithoutAttributes)).toBe(false);
    });

    it('search type does not have showSavedObject filter', () => {
      render(<OpenSearchPanel onClose={mockOnClose} />);

      const searchMetadata = capturedSavedObjectMetaData.find(
        (meta: any) => meta.type === 'search'
      );
      expect(searchMetadata).toBeDefined();
      expect(searchMetadata.showSavedObject).toBeUndefined();
    });
  });
});
