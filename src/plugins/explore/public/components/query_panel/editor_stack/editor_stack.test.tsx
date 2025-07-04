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

jest.mock('./edit_toolbar', () => ({
  EditToolbar: () => <div data-test-subj="edit-toolbar">Edit Toolbar Mock</div>,
}));

jest.mock('../../../application/utils/state_management/selectors', () => ({
  selectIsDualEditorMode: jest.fn(),
  selectIsLoading: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: any) => selector(),
}));

import {
  selectIsDualEditorMode,
  selectIsLoading,
} from '../../../application/utils/state_management/selectors';

const mockSelectIsDualEditorMode = selectIsDualEditorMode as jest.MockedFunction<
  typeof selectIsDualEditorMode
>;
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
    mockSelectIsDualEditorMode.mockReturnValue(false);
    mockSelectIsLoading.mockReturnValue(false);
  });

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders the editor stack container', () => {
    renderWithProvider(<EditorStack />);

    const editorStack = screen.getByTestId('exploreEditorStack');
    expect(editorStack).toBeInTheDocument();
    expect(editorStack).toHaveClass('queryPanel__editorStack');
  });

  it('always renders TopEditor and BottomEditor', () => {
    renderWithProvider(<EditorStack />);

    expect(screen.getByTestId('top-editor')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-editor')).toBeInTheDocument();
  });

  it('does not render EditToolbar when not in dual editor mode', () => {
    mockSelectIsDualEditorMode.mockReturnValue(false);

    renderWithProvider(<EditorStack />);

    expect(screen.queryByTestId('edit-toolbar')).not.toBeInTheDocument();
  });

  it('renders EditToolbar when in dual editor mode', () => {
    mockSelectIsDualEditorMode.mockReturnValue(true);

    renderWithProvider(<EditorStack />);

    expect(screen.getByTestId('edit-toolbar')).toBeInTheDocument();
  });

  it('renders progress container with correct test subject', () => {
    renderWithProvider(<EditorStack />);

    const progressContainer = screen.getByTestId('queryPanelEditorProgress');
    expect(progressContainer).toBeInTheDocument();
    expect(progressContainer).toHaveClass('queryPanel__editorStack__progress');
  });

  it('does not show progress bar when not loading', () => {
    mockSelectIsLoading.mockReturnValue(false);

    renderWithProvider(<EditorStack />);

    expect(screen.queryByTestId('queryPanelIsLoading')).not.toBeInTheDocument();
  });

  it('shows progress bar when loading', () => {
    mockSelectIsLoading.mockReturnValue(true);

    renderWithProvider(<EditorStack />);

    expect(screen.getByTestId('queryPanelIsLoading')).toBeInTheDocument();
  });

  it('handles dual editor mode toggle correctly', () => {
    mockSelectIsDualEditorMode.mockReturnValue(false);

    const { rerender } = renderWithProvider(<EditorStack />);

    // Initially no toolbar
    expect(screen.queryByTestId('edit-toolbar')).not.toBeInTheDocument();

    // Switch to dual editor mode
    mockSelectIsDualEditorMode.mockReturnValue(true);

    rerender(
      <Provider store={createMockStore()}>
        <EditorStack />
      </Provider>
    );

    // Now toolbar should be present
    expect(screen.getByTestId('edit-toolbar')).toBeInTheDocument();
  });

  it('handles loading state toggle correctly', () => {
    mockSelectIsLoading.mockReturnValue(false);

    const { rerender } = renderWithProvider(<EditorStack />);

    // Initially no progress bar
    expect(screen.queryByTestId('queryPanelIsLoading')).not.toBeInTheDocument();

    // Switch to loading state
    mockSelectIsLoading.mockReturnValue(true);

    rerender(
      <Provider store={createMockStore()}>
        <EditorStack />
      </Provider>
    );

    // Now progress bar should be present
    expect(screen.getByTestId('queryPanelIsLoading')).toBeInTheDocument();
  });
});
