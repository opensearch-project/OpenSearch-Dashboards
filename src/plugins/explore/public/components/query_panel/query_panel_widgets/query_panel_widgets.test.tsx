/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryPanelWidgets } from './query_panel_widgets';
import { useDatasetContext } from '../../../application/context';
import { useSelector } from 'react-redux';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  connect: jest.fn(() => (component: any) => component),
  Provider: ({ children }: any) => children,
}));

// Mock the selectors
jest.mock('../../../application/utils/state_management/selectors', () => ({
  selectQueryStatus: jest.fn(),
  selectEditorMode: jest.fn(),
}));

// Mock all child components
jest.mock('./dataset_select', () => ({
  DatasetSelectWidget: () => <div data-test-subj="dataset-select-widget">Dataset Select</div>,
}));

jest.mock('./save_query', () => ({
  SaveQueryButton: () => <div data-test-subj="save-query-button">Save Query</div>,
}));

jest.mock('./recent_queries_button', () => ({
  RecentQueriesButton: () => <div data-test-subj="recent-queries-button">Recent Queries</div>,
}));

jest.mock('./language_reference', () => ({
  LanguageReference: () => <div data-test-subj="language-reference">Language Reference</div>,
}));

jest.mock('./language_toggle', () => ({
  LanguageToggle: () => <div data-test-subj="language-toggle">Language Toggle</div>,
}));

jest.mock('./query_panel_error', () => ({
  QueryPanelError: () => <div data-test-subj="query-panel-error">Query Panel Error</div>,
}));

jest.mock('../../../application/context', () => ({
  useDatasetContext: jest.fn(),
}));

const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;
const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;

describe('QueryPanelWidgets', () => {
  const mockQueryStatus = {
    status: 'ready',
    elapsedMs: 150,
    startTime: Date.now(),
    body: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useSelector to return queryStatus since that's the only selector used now
    mockUseSelector.mockReturnValue(mockQueryStatus);
  });

  it('renders all footer components with correct layout', () => {
    mockUseDatasetContext.mockReturnValue({
      dataset: { timeFieldName: '@timestamp' } as any,
      isLoading: false,
      error: null,
    });

    const { container } = render(<QueryPanelWidgets />);

    // Check main container
    expect(container.querySelector('.exploreQueryPanelWidgets')).toBeInTheDocument();

    // Check left section components
    expect(screen.getByTestId('dataset-select-widget')).toBeInTheDocument();
    expect(screen.getByTestId('recent-queries-button')).toBeInTheDocument();
    expect(screen.getByTestId('save-query-button')).toBeInTheDocument();
    expect(screen.getByTestId('query-panel-error')).toBeInTheDocument();

    // Check right section components
    expect(screen.getByTestId('language-reference')).toBeInTheDocument();
    expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
  });
});
