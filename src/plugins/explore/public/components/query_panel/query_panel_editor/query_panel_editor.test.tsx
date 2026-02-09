/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryPanelEditor } from './query_panel_editor';

jest.mock('./use_query_panel_editor', () => ({
  useQueryPanelEditor: jest.fn(),
}));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  CodeEditor: ({ value, languageId, onChange, options, ...props }: any) => (
    <div data-test-subj="code-editor" value={value} languageId={languageId} {...props}>
      Code Editor Mock
    </div>
  ),
  withOpenSearchDashboards: jest.fn((component: any) => component),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: any) => selector(),
}));

import { useQueryPanelEditor } from './use_query_panel_editor';

const mockUseQueryPanelEditor = useQueryPanelEditor as jest.MockedFunction<
  typeof useQueryPanelEditor
>;

describe('QueryPanelEditor', () => {
  const mockUseQueryPanelEditorReturn = {
    editorDidMount: jest.fn(),
    isFocused: false,
    isPromptMode: false,
    languageConfiguration: {},
    languageId: 'sql',
    onChange: jest.fn(),
    onEditorClick: jest.fn(),
    options: {},
    placeholder: 'Ask a question or search using </> PPL',
    promptIsTyping: false,
    showPlaceholder: false,
    useLatestTheme: true as const,
    value: 'SELECT * FROM logs',
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
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    mockUseQueryPanelEditor.mockReturnValue(mockUseQueryPanelEditorReturn);
  });

  const renderWithProvider = (component: React.ReactElement) => {
    const store = createMockStore();
    return render(<Provider store={store}>{component}</Provider>);
  };

  it('renders the query panel editor with correct test subject', () => {
    renderWithProvider(<QueryPanelEditor />);

    expect(screen.getByTestId('exploreQueryPanelEditor')).toBeInTheDocument();
    expect(screen.getByTestId('code-editor')).toBeInTheDocument();
    expect(screen.getByText('Code Editor Mock')).toBeInTheDocument();
  });

  it('applies focused class when editor is focused', () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    mockUseQueryPanelEditor.mockReturnValue({
      ...mockUseQueryPanelEditorReturn,
      isFocused: true,
    });

    renderWithProvider(<QueryPanelEditor />);

    const editor = screen.getByTestId('exploreQueryPanelEditor');
    expect(editor).toHaveClass('exploreQueryPanelEditor--focused');
  });

  it('does not apply focused class when editor is not focused', () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    mockUseQueryPanelEditor.mockReturnValue({
      ...mockUseQueryPanelEditorReturn,
      isFocused: false,
    });

    renderWithProvider(<QueryPanelEditor />);

    const editor = screen.getByTestId('exploreQueryPanelEditor');
    expect(editor).not.toHaveClass('exploreQueryPanelEditor--focused');
  });

  it('applies prompt mode class when in prompt mode', () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    mockUseQueryPanelEditor.mockReturnValue({
      ...mockUseQueryPanelEditorReturn,
      isPromptMode: true,
    });

    renderWithProvider(<QueryPanelEditor />);

    const editor = screen.getByTestId('exploreQueryPanelEditor');
    expect(editor).toHaveClass('exploreQueryPanelEditor--promptMode');
  });

  it('does not apply prompt mode class when not in prompt mode', () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    mockUseQueryPanelEditor.mockReturnValue({
      ...mockUseQueryPanelEditorReturn,
      isPromptMode: false,
    });

    renderWithProvider(<QueryPanelEditor />);

    const editor = screen.getByTestId('exploreQueryPanelEditor');
    expect(editor).not.toHaveClass('exploreQueryPanelEditor--promptMode');
  });

  it('applies prompt is typing class when promptIsTyping is true', () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    mockUseQueryPanelEditor.mockReturnValue({
      ...mockUseQueryPanelEditorReturn,
      promptIsTyping: true,
    });

    renderWithProvider(<QueryPanelEditor />);

    const editor = screen.getByTestId('exploreQueryPanelEditor');
    expect(editor).toHaveClass('exploreQueryPanelEditor--promptIsTyping');
  });

  it('does not apply prompt is typing class when promptIsTyping is false', () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    mockUseQueryPanelEditor.mockReturnValue({
      ...mockUseQueryPanelEditorReturn,
      promptIsTyping: false,
    });

    renderWithProvider(<QueryPanelEditor />);

    const editor = screen.getByTestId('exploreQueryPanelEditor');
    expect(editor).not.toHaveClass('exploreQueryPanelEditor--promptIsTyping');
  });

  it('shows placeholder when showPlaceholder is true', () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    mockUseQueryPanelEditor.mockReturnValue({
      ...mockUseQueryPanelEditorReturn,
      showPlaceholder: true,
      placeholder: 'Ask a question or search using </> PPL',
    });

    renderWithProvider(<QueryPanelEditor />);

    expect(screen.getByText('Ask a question or search using </> PPL')).toBeInTheDocument();
  });

  it('does not show placeholder when showPlaceholder is false', () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    mockUseQueryPanelEditor.mockReturnValue({
      ...mockUseQueryPanelEditorReturn,
      showPlaceholder: false,
      placeholder: 'Ask a question or search using </> PPL',
    });

    renderWithProvider(<QueryPanelEditor />);

    expect(screen.queryByText('Ask a question or search using </> PPL')).not.toBeInTheDocument();
  });

  it('shows custom placeholder text', () => {
    const customPlaceholder = 'Custom placeholder text';
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    mockUseQueryPanelEditor.mockReturnValue({
      ...mockUseQueryPanelEditorReturn,
      showPlaceholder: true,
      placeholder: customPlaceholder,
    });

    renderWithProvider(<QueryPanelEditor />);

    expect(screen.getByText(customPlaceholder)).toBeInTheDocument();
  });

  it('passes correct props to CodeEditor', () => {
    const customProps = {
      ...mockUseQueryPanelEditorReturn,
      value: 'SELECT COUNT(*) FROM users',
      languageId: 'ppl',
    };

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    mockUseQueryPanelEditor.mockReturnValue(customProps);

    renderWithProvider(<QueryPanelEditor />);

    const codeEditor = screen.getByTestId('code-editor');
    expect(codeEditor).toHaveAttribute('value', 'SELECT COUNT(*) FROM users');
    expect(codeEditor).toHaveAttribute('languageId', 'ppl');
  });

  describe('onEditorClick', () => {
    it('calls onEditorClick when editor wrapper is clicked', () => {
      const mockOnEditorClick = jest.fn();
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockUseQueryPanelEditor.mockReturnValue({
        ...mockUseQueryPanelEditorReturn,
        onEditorClick: mockOnEditorClick,
      });

      renderWithProvider(<QueryPanelEditor />);

      expect(mockOnEditorClick).not.toHaveBeenCalled();

      const editor = screen.getByTestId('exploreQueryPanelEditor');
      fireEvent.click(editor);

      expect(mockOnEditorClick).toHaveBeenCalledTimes(1);
    });
  });
});
