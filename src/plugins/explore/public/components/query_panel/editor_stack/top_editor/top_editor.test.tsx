/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
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
}));

jest.mock('../../../../application/context', () => ({
  useEditorContextByEditorComponent: jest.fn(),
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
import { useEditorContextByEditorComponent } from '../../../../application/context';

const mockUseTopEditor = useTopEditor as jest.MockedFunction<typeof useTopEditor>;
const mockSelectEditorMode = selectEditorMode as jest.MockedFunction<typeof selectEditorMode>;
const mockSelectPromptModeIsAvailable = selectPromptModeIsAvailable as jest.MockedFunction<
  typeof selectPromptModeIsAvailable
>;
const mockUseEditorContextByEditorComponent = useEditorContextByEditorComponent as jest.MockedFunction<
  typeof useEditorContextByEditorComponent
>;

describe('TopEditor', () => {
  const mockTopEditorRef = {
    current: {
      focus: jest.fn(),
    },
  };

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
    mockUseEditorContextByEditorComponent.mockReturnValue({
      topEditorRef: mockTopEditorRef,
      topEditorText: '',
    } as any);
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
    mockUseEditorContextByEditorComponent.mockReturnValue({
      topEditorRef: mockTopEditorRef,
      topEditorText: '',
    } as any);

    renderWithProvider(<TopEditor />);

    expect(screen.getByText('Ask a question or search using </> PPL')).toBeInTheDocument();
  });

  it('shows dual editor placeholder when in DualPrompt mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualPrompt);
    mockUseEditorContextByEditorComponent.mockReturnValue({
      topEditorRef: mockTopEditorRef,
      topEditorText: '',
    } as any);

    renderWithProvider(<TopEditor />);

    expect(screen.getByText('Ask a question')).toBeInTheDocument();
  });

  it('does not show placeholder when text is present', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
    mockUseEditorContextByEditorComponent.mockReturnValue({
      topEditorRef: mockTopEditorRef,
      topEditorText: 'SELECT * FROM logs',
    } as any);

    renderWithProvider(<TopEditor />);

    expect(screen.queryByText('Ask a question or search using </> PPL')).not.toBeInTheDocument();
  });

  it('does not show placeholder when readonly', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
    mockUseEditorContextByEditorComponent.mockReturnValue({
      topEditorRef: mockTopEditorRef,
      topEditorText: '',
    } as any);

    renderWithProvider(<TopEditor />);

    expect(screen.queryByText('Ask a question or search using </> PPL')).not.toBeInTheDocument();
  });

  it('focuses editor when not in DualQuery mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);

    renderWithProvider(<TopEditor />);

    expect(mockTopEditorRef.current.focus).toHaveBeenCalled();
  });

  it('does not focus editor when in DualQuery mode', () => {
    mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);

    renderWithProvider(<TopEditor />);

    expect(mockTopEditorRef.current.focus).not.toHaveBeenCalled();
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
      mockUseEditorContextByEditorComponent.mockReturnValue({
        topEditorRef: mockTopEditorRef,
        topEditorText: '',
      } as any);

      renderWithProvider(<TopEditor />);

      expect(screen.getByText('Search using </> PPL')).toBeInTheDocument();
    });

    it('shows normal single placeholder when promptModeIsAvailable is true', () => {
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
      mockSelectPromptModeIsAvailable.mockReturnValue(true);
      mockUseEditorContextByEditorComponent.mockReturnValue({
        topEditorRef: mockTopEditorRef,
        topEditorText: '',
      } as any);

      renderWithProvider(<TopEditor />);

      expect(screen.getByText('Ask a question or search using </> PPL')).toBeInTheDocument();
    });

    it('shows dual prompt placeholder when in DualPrompt mode regardless of promptModeIsAvailable', () => {
      mockSelectEditorMode.mockReturnValue(EditorMode.DualPrompt);
      mockSelectPromptModeIsAvailable.mockReturnValue(false);
      mockUseEditorContextByEditorComponent.mockReturnValue({
        topEditorRef: mockTopEditorRef,
        topEditorText: '',
      } as any);

      renderWithProvider(<TopEditor />);

      expect(screen.getByText('Search using </> PPL')).toBeInTheDocument();
    });
  });
});
