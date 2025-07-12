/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { TopEditor } from './top_editor';
import { EditorMode } from '../../../../application/utils/state_management/types';

jest.mock('../../utils', () => ({
  useTopEditor: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
  selectIsDualEditorMode: jest.fn(),
  selectPromptModeIsAvailable: jest.fn(),
}));

jest.mock('./edit_toolbar', () => ({
  EditToolbar: () => <div data-test-subj="edit-toolbar">Edit Toolbar Mock</div>,
}));

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  CodeEditor: ({ ...props }: any) => (
    <div data-test-subj="code-editor" {...props}>
      Code Editor Mock
    </div>
  ),
  withOpenSearchDashboards: jest.fn((component: any) => component),
}));

jest.mock('../../../../application/hooks', () => ({
  useTopEditorText: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: any) => selector(),
}));

import { useTopEditor } from '../../utils';
import {
  selectEditorMode,
  selectIsDualEditorMode,
  selectPromptModeIsAvailable,
} from '../../../../application/utils/state_management/selectors';
import { useTopEditorText } from '../../../../application/hooks';

const mockUseTopEditor = useTopEditor as jest.MockedFunction<typeof useTopEditor>;
const mockSelectEditorMode = selectEditorMode as jest.MockedFunction<typeof selectEditorMode>;
const mockSelectIsDualEditorMode = selectIsDualEditorMode as jest.MockedFunction<
  typeof selectIsDualEditorMode
>;
const mockSelectPromptModeIsAvailable = selectPromptModeIsAvailable as jest.MockedFunction<
  typeof selectPromptModeIsAvailable
>;
const mockUseTopEditorText = useTopEditorText as jest.MockedFunction<typeof useTopEditorText>;

describe('TopEditor', () => {
  const mockEditorProps = {
    value: 'SELECT * FROM logs',
    onChange: jest.fn(),
    onFocus: jest.fn(),
    onBlur: jest.fn(),
    language: 'sql',
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
    mockUseTopEditorText.mockReturnValue('');
    mockUseTopEditor.mockReturnValue({
      isFocused: false,
      onWrapperClick: jest.fn(),
      ...mockEditorProps,
    } as any);
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    mockSelectIsDualEditorMode.mockReturnValue(false);
    mockSelectPromptModeIsAvailable.mockReturnValue(true);
  });

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders the top editor with correct test subject', () => {
    renderWithProvider(<TopEditor />);

    expect(screen.getByTestId('exploreTopEditor')).toBeInTheDocument();
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    expect(screen.getByText('Code Editor Mock')).toBeInTheDocument();
  });

  it('applies readonly class when in DualQuery mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);

    renderWithProvider(<TopEditor />);

    const topEditor = screen.getByTestId('exploreTopEditor');
    expect(topEditor).toHaveClass('exploreTopEditor--readonly');
  });

  it('does not apply readonly class when not in DualQuery mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);

    renderWithProvider(<TopEditor />);

    const topEditor = screen.getByTestId('exploreTopEditor');
    expect(topEditor).not.toHaveClass('exploreTopEditor--readonly');
  });

  it('applies focused class when editor is focused', () => {
    mockUseTopEditor.mockReturnValue({
      isFocused: true,
      onWrapperClick: jest.fn(),
      ...mockEditorProps,
    } as any);

    renderWithProvider(<TopEditor />);

    const topEditor = screen.getByTestId('exploreTopEditor');
    expect(topEditor).toHaveClass('exploreTopEditor--focused');
  });

  it('does not apply focused class when editor is not focused', () => {
    mockUseTopEditor.mockReturnValue({
      isFocused: false,
      onWrapperClick: jest.fn(),
      ...mockEditorProps,
    } as any);

    renderWithProvider(<TopEditor />);

    const topEditor = screen.getByTestId('exploreTopEditor');
    expect(topEditor).not.toHaveClass('exploreTopEditor--focused');
  });

  it('applies dual mode class when isDualMode is true', () => {
    mockSelectIsDualEditorMode.mockReturnValue(true);

    renderWithProvider(<TopEditor />);

    const topEditor = screen.getByTestId('exploreTopEditor');
    expect(topEditor).toHaveClass('exploreTopEditor--dualMode');
  });

  it('applies prompt mode class when in prompt mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SinglePrompt);

    renderWithProvider(<TopEditor />);

    const topEditor = screen.getByTestId('exploreTopEditor');
    expect(topEditor).toHaveClass('exploreTopEditor--promptMode');
  });

  it('renders overlay div', () => {
    const { container } = renderWithProvider(<TopEditor />);

    const overlay = container.querySelector('.exploreTopEditor__overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('renders EditToolbar when in dual mode', () => {
    mockSelectIsDualEditorMode.mockReturnValue(true);

    renderWithProvider(<TopEditor />);

    expect(screen.getByTestId('edit-toolbar')).toBeInTheDocument();
  });

  it('does not render EditToolbar when not in dual mode', () => {
    mockSelectIsDualEditorMode.mockReturnValue(false);

    renderWithProvider(<TopEditor />);

    expect(screen.queryByTestId('edit-toolbar')).not.toBeInTheDocument();
  });

  it('does not show placeholder (showPlaceholder is hardcoded to false)', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    mockUseTopEditorText.mockReturnValue('');

    renderWithProvider(<TopEditor />);

    // The current implementation has showPlaceholder hardcoded to false
    expect(screen.queryByText('Ask a question or search using </> PPL')).not.toBeInTheDocument();
  });

  it('passes correct props to CodeEditor', () => {
    const customProps = {
      isFocused: false,
      onWrapperClick: jest.fn(),
      value: 'SELECT COUNT(*) FROM users',
      onChange: jest.fn(),
      language: 'ppl',
      onFocus: jest.fn(),
      onBlur: jest.fn(),
    };

    mockUseTopEditor.mockReturnValue(customProps as any);

    renderWithProvider(<TopEditor />);

    const codeEditor = screen.getByTestId('code-editor');
    expect(codeEditor).toHaveAttribute('value', 'SELECT COUNT(*) FROM users');
    expect(codeEditor).toHaveAttribute('language', 'ppl');
  });

  describe('onWrapperClick', () => {
    it('calls onWrapperClick when top editor wrapper is clicked', () => {
      const mockOnWrapperClick = jest.fn();
      mockUseTopEditor.mockReturnValue({
        isFocused: false,
        onWrapperClick: mockOnWrapperClick,
        ...mockEditorProps,
      } as any);

      renderWithProvider(<TopEditor />);

      expect(mockOnWrapperClick).not.toHaveBeenCalled();

      const topEditor = screen.getByTestId('exploreTopEditor');
      fireEvent.click(topEditor);

      expect(mockOnWrapperClick).toHaveBeenCalledTimes(1);
    });
  });
});
