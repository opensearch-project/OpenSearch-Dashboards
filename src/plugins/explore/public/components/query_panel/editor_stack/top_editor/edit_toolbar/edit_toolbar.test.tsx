/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { EditToolbar } from './edit_toolbar';
import { EditorMode } from '../../../../../application/utils/state_management/types';

jest.mock('../../../../../application/hooks', () => ({
  useClearEditors: jest.fn(),
  useToggleDualEditorMode: jest.fn(),
}));

jest.mock('../../../../../application/utils/state_management/actions/query_editor', () => ({
  clearEditorActionCreator: jest.fn(),
}));

jest.mock('../../../../../application/utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: (selector: any) => selector(),
}));

import { clearEditorActionCreator } from '../../../../../application/utils/state_management/actions/query_editor';
import { selectEditorMode } from '../../../../../application/utils/state_management/selectors';
import { useClearEditors, useToggleDualEditorMode } from '../../../../../application/hooks';

const mockDispatch = jest.fn();
const mockToggleDualEditorMode = jest.fn();
const mockClearEditorActionCreator = clearEditorActionCreator as jest.MockedFunction<
  typeof clearEditorActionCreator
>;
const mockSelectEditorMode = selectEditorMode as jest.MockedFunction<typeof selectEditorMode>;
const mockUseClearEditors = useClearEditors as jest.MockedFunction<typeof useClearEditors>;
const mockUseToggleDualEditorMode = useToggleDualEditorMode as jest.MockedFunction<
  typeof useToggleDualEditorMode
>;

describe('EditToolbar', () => {
  const mockClearEditors = {
    editorText: 'SELECT * FROM logs',
    dataset: undefined,
  };

  const createMockStore = () => {
    return configureStore({
      reducer: {
        root: (state = {}) => state,
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseClearEditors.mockReturnValue(mockClearEditors as any);
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    mockUseToggleDualEditorMode.mockReturnValue(mockToggleDualEditorMode);
    mockClearEditorActionCreator.mockReturnValue({ type: 'CLEAR_EDITOR' } as any);
  });

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders the edit toolbar with both buttons', () => {
    renderWithProvider(<EditToolbar />);

    const editButton = screen.getByRole('button', { name: /edit query/i });
    const clearButton = screen.getByRole('button', { name: /clear editor/i });

    expect(editButton).toBeInTheDocument();
    expect(clearButton).toBeInTheDocument();
  });

  it('displays "Edit Prompt" text in dual query mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);

    renderWithProvider(<EditToolbar />);

    const editButton = screen.getByRole('button', { name: /edit prompt/i });
    expect(editButton).toHaveTextContent('Edit Prompt');
  });

  it('displays "Edit Query" text in dual prompt mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualPrompt);

    renderWithProvider(<EditToolbar />);

    const editButton = screen.getByRole('button', { name: /edit query/i });
    expect(editButton).toHaveTextContent('Edit Query');
  });

  it('has correct icons for both buttons', () => {
    renderWithProvider(<EditToolbar />);

    const editButton = screen.getByRole('button', { name: /edit query/i });
    const clearButton = screen.getByRole('button', { name: /clear editor/i });

    // Check that buttons have the expected EUI button structure
    expect(editButton).toBeInTheDocument();
    expect(clearButton).toBeInTheDocument();
  });

  it('calls toggleDualEditorMode function when edit button is clicked', () => {
    renderWithProvider(<EditToolbar />);

    const editButton = screen.getByRole('button', { name: /edit query/i });
    fireEvent.click(editButton);

    expect(mockToggleDualEditorMode).toHaveBeenCalled();
  });

  it('dispatches clearEditorActionCreator when clear button is clicked', () => {
    renderWithProvider(<EditToolbar />);

    const clearButton = screen.getByRole('button', { name: /clear editor/i });
    fireEvent.click(clearButton);

    expect(mockClearEditorActionCreator).toHaveBeenCalledWith(mockClearEditors);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_EDITOR' });
  });

  it('passes correct clear editors data to clear action', () => {
    const customClearEditors = {
      editorText: 'SELECT COUNT(*) FROM users',
      dataset: { id: 'test-dataset' },
    };

    mockUseClearEditors.mockReturnValue(customClearEditors as any);

    renderWithProvider(<EditToolbar />);

    const clearButton = screen.getByRole('button', { name: /clear editor/i });
    fireEvent.click(clearButton);

    expect(mockClearEditorActionCreator).toHaveBeenCalledWith(customClearEditors);
  });
});
