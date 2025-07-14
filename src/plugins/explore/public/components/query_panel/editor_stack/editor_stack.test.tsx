/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { EditorStack } from './editor_stack';

jest.mock('./top_editor', () => ({
  TopEditor: () => <div data-test-subj="top-editor">Top Editor Mock</div>,
}));

jest.mock('./bottom_editor', () => ({
  BottomEditor: () => <div data-test-subj="bottom-editor">Bottom Editor Mock</div>,
}));

jest.mock('../../../application/utils/state_management/selectors', () => ({
  selectIsLoading: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: any) => selector(),
}));

import { selectIsLoading } from '../../../application/utils/state_management/selectors';

const mockSelectIsLoading = selectIsLoading as jest.MockedFunction<typeof selectIsLoading>;

describe('EditorStack', () => {
  const createMockStore = () => {
    return configureStore({
      reducer: {
        root: (state = {}) => state,
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectIsLoading.mockReturnValue(false);
  });

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders both TopEditor and BottomEditor', () => {
    renderWithProvider(<EditorStack />);

    expect(screen.getByTestId('top-editor')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-editor')).toBeInTheDocument();
  });

  it('does not show progress bar when not loading', () => {
    mockSelectIsLoading.mockReturnValue(false);

    renderWithProvider(<EditorStack />);

    expect(screen.queryByTestId('exploreQueryPanelIsLoading')).not.toBeInTheDocument();
  });

  it('shows progress bar when loading', () => {
    mockSelectIsLoading.mockReturnValue(true);

    renderWithProvider(<EditorStack />);

    expect(screen.getByTestId('exploreQueryPanelIsLoading')).toBeInTheDocument();
  });

  it('renders progress bar with correct properties when loading', () => {
    mockSelectIsLoading.mockReturnValue(true);

    renderWithProvider(<EditorStack />);

    const progressBar = screen.getByTestId('exploreQueryPanelIsLoading');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveClass('euiProgress--xs');
    expect(progressBar).toHaveClass('euiProgress--accent');
    expect(progressBar).toHaveClass('euiProgress--absolute');
  });

  it('handles loading state changes correctly', () => {
    mockSelectIsLoading.mockReturnValue(false);

    const { rerender } = renderWithProvider(<EditorStack />);

    // Initially no progress bar
    expect(screen.queryByTestId('exploreQueryPanelIsLoading')).not.toBeInTheDocument();

    // Switch to loading state
    mockSelectIsLoading.mockReturnValue(true);

    rerender(
      <Provider store={createMockStore()}>
        <EditorStack />
      </Provider>
    );

    // Now progress bar should be present
    expect(screen.getByTestId('exploreQueryPanelIsLoading')).toBeInTheDocument();
  });
});
