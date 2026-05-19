/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { QueryPanelGeneratedQuery } from './generated_query_panel';
import { EditorMode } from '../../../utils/state_management/types';
import { QueryPanelFullProps } from './query_panel_context';

const mockHandleEditorChange = jest.fn();
const mockSetEditorText = jest.fn();
const mockFocusEditor = jest.fn();

jest.mock('./query_panel_context', () => ({
  useQueryPanelContext: (): Partial<QueryPanelFullProps> => ({
    queryEditorState: mockQueryEditorState,
    handleEditorChange: mockHandleEditorChange,
    editorOperations: {
      setEditorText: mockSetEditorText,
      focusEditor: mockFocusEditor,
    } as any,
  }),
}));

let mockQueryEditorState: any;

beforeEach(() => {
  jest.clearAllMocks();
  mockQueryEditorState = { lastExecutedTranslatedQuery: undefined };
});

const renderWithQuery = (lastExecutedTranslatedQuery?: string) => {
  mockQueryEditorState = { lastExecutedTranslatedQuery };
  return render(<QueryPanelGeneratedQuery />);
};

describe('QueryPanelGeneratedQuery', () => {
  it('renders null when lastExecutedTranslatedQuery is not present', () => {
    const { container } = renderWithQuery(undefined);
    expect(container.firstChild).toBeNull();
  });

  it('renders the generated query text', () => {
    renderWithQuery('source=logs | head 10');
    expect(screen.getByTestId('exploreQueryPanelGeneratedQuery')).toHaveTextContent(
      'source=logs | head 10'
    );
  });

  it('renders the edit button', () => {
    renderWithQuery('source=logs');
    expect(screen.getByTestId('exploreQueryPanelGeneratedQueryEditButton')).toBeInTheDocument();
  });

  it('clicking edit sets editor text with the query', () => {
    renderWithQuery('source=logs | head 10');
    fireEvent.click(screen.getByTestId('exploreQueryPanelGeneratedQueryEditButton'));
    expect(mockSetEditorText).toHaveBeenCalledWith('source=logs | head 10');
  });

  it('clicking edit switches editor mode to Query and clears lastExecutedTranslatedQuery', () => {
    renderWithQuery('source=logs');
    fireEvent.click(screen.getByTestId('exploreQueryPanelGeneratedQueryEditButton'));
    expect(mockHandleEditorChange).toHaveBeenCalledWith({
      editorMode: EditorMode.Query,
      lastExecutedTranslatedQuery: undefined,
    });
  });

  it('clicking edit focuses the editor', () => {
    renderWithQuery('source=logs');
    fireEvent.click(screen.getByTestId('exploreQueryPanelGeneratedQueryEditButton'));
    expect(mockFocusEditor).toHaveBeenCalledWith(true);
  });
});
