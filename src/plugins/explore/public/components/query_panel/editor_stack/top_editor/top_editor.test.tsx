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
  selectPromptModeIsAvailable: jest.fn(),
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
  selectPromptModeIsAvailable,
} from '../../../../application/utils/state_management/selectors';
import { useTopEditorText } from '../../../../application/hooks';

const mockUseTopEditor = useTopEditor as jest.MockedFunction<typeof useTopEditor>;
const mockSelectEditorMode = selectEditorMode as jest.MockedFunction<typeof selectEditorMode>;
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
      ...mockEditorProps,
    } as any);
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    mockSelectPromptModeIsAvailable.mockReturnValue(true);
  });

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders the top editor component', () => {
    renderWithProvider(<TopEditor />);

    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    expect(screen.getByText('Code Editor Mock')).toBeInTheDocument();
  });

  it('is readonly when in DualQuery mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);

    const { container } = renderWithProvider(<TopEditor />);

    const editor = container.querySelector('.queryEditor');
    expect(editor).toHaveClass('queryEditor--readonly');
  });

  it('is not readonly when not in DualQuery mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);

    const { container } = renderWithProvider(<TopEditor />);

    const editor = container.querySelector('.queryEditor');
    expect(editor).not.toHaveClass('queryEditor--readonly');
  });

  it('shows focused state when editor is focused', () => {
    mockUseTopEditor.mockReturnValue({
      isFocused: true,
      ...mockEditorProps,
    } as any);

    const { container } = renderWithProvider(<TopEditor />);

    const editor = container.querySelector('.queryEditor');
    expect(editor).toHaveClass('queryEditor--focused');
  });

  it('does not show focused state when editor is not focused', () => {
    mockUseTopEditor.mockReturnValue({
      isFocused: false,
      ...mockEditorProps,
    } as any);

    const { container } = renderWithProvider(<TopEditor />);

    const editor = container.querySelector('.queryEditor');
    expect(editor).not.toHaveClass('queryEditor--focused');
  });

  it('shows single editor placeholder when text is empty and not readonly', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    mockUseTopEditorText.mockReturnValue('');

    renderWithProvider(<TopEditor />);

    expect(screen.getByText('Ask a question or search using </> PPL')).toBeInTheDocument();
  });

  it('shows dual editor placeholder when in DualPrompt mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualPrompt);
    mockUseTopEditorText.mockReturnValue('');

    renderWithProvider(<TopEditor />);

    expect(screen.getByText('Ask a question')).toBeInTheDocument();
  });

  it('does not show placeholder when text is present', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    mockUseTopEditorText.mockReturnValue('SELECT * FROM logs');

    renderWithProvider(<TopEditor />);

    expect(screen.queryByText('Ask a question or search using </> PPL')).not.toBeInTheDocument();
  });

  it('does not show placeholder when readonly', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
    mockUseTopEditorText.mockReturnValue('');

    renderWithProvider(<TopEditor />);

    expect(screen.queryByText('Ask a question or search using </> PPL')).not.toBeInTheDocument();
  });

  it('passes correct props to CodeEditor', () => {
    const customProps = {
      isFocused: false,
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

  describe('placeholder based on promptModeIsAvailable', () => {
    it('shows disabled prompt placeholder when promptModeIsAvailable is false', () => {
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);
      mockUseTopEditorText.mockReturnValue('');

      renderWithProvider(<TopEditor />);

      expect(screen.getByText('Search using </> PPL')).toBeInTheDocument();
    });

    it('shows normal single placeholder when promptModeIsAvailable is true', () => {
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);
      mockUseTopEditorText.mockReturnValue('');

      renderWithProvider(<TopEditor />);

      expect(screen.getByText('Ask a question or search using </> PPL')).toBeInTheDocument();
    });

    it('shows dual prompt placeholder when in DualPrompt mode regardless of promptModeIsAvailable', () => {
      mockSelectEditorMode.mockReturnValue(EditorMode.DualPrompt);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);
      mockUseTopEditorText.mockReturnValue('');

      renderWithProvider(<TopEditor />);

      expect(screen.getByText('Search using </> PPL')).toBeInTheDocument();
    });
  });

  describe('onWrapperClick', () => {
    it('calls onWrapperClick when editor wrapper is clicked', () => {
      const mockOnWrapperClick = jest.fn();
      mockUseTopEditor.mockReturnValue({
        isFocused: false,
        onWrapperClick: mockOnWrapperClick,
        ...mockEditorProps,
      } as any);

      const { container } = renderWithProvider(<TopEditor />);
      const editorWrapper = container.querySelector('[data-test-subj="exploreReusableEditor"]');

      fireEvent.click(editorWrapper!);

      expect(mockOnWrapperClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onWrapperClick when editor wrapper is not clicked', () => {
      const mockOnWrapperClick = jest.fn();
      mockUseTopEditor.mockReturnValue({
        isFocused: false,
        onWrapperClick: mockOnWrapperClick,
        ...mockEditorProps,
      } as any);

      renderWithProvider(<TopEditor />);

      expect(mockOnWrapperClick).not.toHaveBeenCalled();
    });
  });
});
