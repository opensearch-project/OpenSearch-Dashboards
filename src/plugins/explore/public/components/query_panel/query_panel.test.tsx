/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryPanel } from './query_panel';

jest.mock('./query_panel_editor', () => ({
  QueryPanelEditor: () => <div data-test-subj="query-panel-editor">Query Panel Editor</div>,
}));

jest.mock('./query_panel_generated_query', () => ({
  QueryPanelGeneratedQuery: () => (
    <div data-test-subj="query-panel-generated-query">Query Panel Generated Query</div>
  ),
}));

jest.mock('./query_panel_widgets', () => ({
  QueryPanelWidgets: () => <div data-test-subj="query-panel-widgets">Query Panel Widgets</div>,
}));

jest.mock('../../application/hooks', () => ({
  useSetEditorTextWithQuery: jest.fn(),
}));

jest.mock('./actions/ppl_execute_query_action', () => ({
  usePPLExecuteQueryAction: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

import { useSelector } from 'react-redux';
import { useSetEditorTextWithQuery } from '../../application/hooks';
import { usePPLExecuteQueryAction } from './actions/ppl_execute_query_action';

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseSetEditorTextWithQuery = useSetEditorTextWithQuery as jest.MockedFunction<
  typeof useSetEditorTextWithQuery
>;
const mockUsePPLExecuteQueryAction = usePPLExecuteQueryAction as jest.MockedFunction<
  typeof usePPLExecuteQueryAction
>;

describe('QueryPanel', () => {
  const createMockStore = () => {
    return configureStore({
      reducer: {
        root: (state = {}) => state,
      },
    });
  };

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockReturnValue(false); // Default to not loading

    // Mock the new hooks
    const mockSetEditorTextWithQuery = jest.fn();
    mockUseSetEditorTextWithQuery.mockReturnValue(mockSetEditorTextWithQuery);
    mockUsePPLExecuteQueryAction.mockImplementation(() => {});
  });

  it('renders QueryPanelEditor component', () => {
    renderWithProvider(<QueryPanel />);
    expect(screen.getByTestId('query-panel-editor')).toBeInTheDocument();
  });

  it('renders QueryPanelGeneratedQuery component', () => {
    renderWithProvider(<QueryPanel />);
    expect(screen.getByTestId('query-panel-generated-query')).toBeInTheDocument();
  });

  it('renders QueryPanelWidgets component', () => {
    renderWithProvider(<QueryPanel />);
    expect(screen.getByTestId('query-panel-widgets')).toBeInTheDocument();
  });

  it('shows loading progress when query is loading', () => {
    mockUseSelector
      .mockReturnValueOnce(true) // queryIsLoading
      .mockReturnValueOnce(false); // promptToQueryIsLoading

    renderWithProvider(<QueryPanel />);
    expect(screen.getByTestId('exploreQueryPanelIsLoading')).toBeInTheDocument();
  });

  it('shows loading progress when prompt to query is loading', () => {
    mockUseSelector
      .mockReturnValueOnce(false) // queryIsLoading
      .mockReturnValueOnce(true); // promptToQueryIsLoading

    renderWithProvider(<QueryPanel />);
    expect(screen.getByTestId('exploreQueryPanelIsLoading')).toBeInTheDocument();
  });

  it('does not show loading progress when not loading', () => {
    mockUseSelector
      .mockReturnValueOnce(false) // queryIsLoading
      .mockReturnValueOnce(false); // promptToQueryIsLoading

    renderWithProvider(<QueryPanel />);
    expect(screen.queryByTestId('exploreQueryPanelIsLoading')).not.toBeInTheDocument();
  });

  it('calls useSetEditorTextWithQuery hook', () => {
    renderWithProvider(<QueryPanel />);
    expect(mockUseSetEditorTextWithQuery).toHaveBeenCalled();
  });

  it('calls usePPLExecuteQueryAction hook with setEditorTextWithQuery', () => {
    const mockSetEditorTextWithQuery = jest.fn();
    mockUseSetEditorTextWithQuery.mockReturnValue(mockSetEditorTextWithQuery);

    renderWithProvider(<QueryPanel />);

    expect(mockUsePPLExecuteQueryAction).toHaveBeenCalledWith(mockSetEditorTextWithQuery);
  });

  it('integrates assistant action functionality', () => {
    const mockSetEditorTextWithQuery = jest.fn();
    mockUseSetEditorTextWithQuery.mockReturnValue(mockSetEditorTextWithQuery);

    renderWithProvider(<QueryPanel />);

    // Verify both hooks are called for assistant integration
    expect(mockUseSetEditorTextWithQuery).toHaveBeenCalled();
    expect(mockUsePPLExecuteQueryAction).toHaveBeenCalledWith(mockSetEditorTextWithQuery);
  });
});
