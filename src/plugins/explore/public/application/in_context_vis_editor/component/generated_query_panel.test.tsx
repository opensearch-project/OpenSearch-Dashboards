/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryPanelGeneratedQuery } from './generated_query_panel';
import { EditorMode } from '../../utils/state_management/types';
import { useQueryBuilderState } from '../hooks/use_query_builder_state';
import { useEditorOperations } from '../hooks/use_editor_operations';
import { useEditorFocus } from '../../../application/hooks';

jest.mock('../hooks/use_query_builder_state', () => ({ useQueryBuilderState: jest.fn() }));
jest.mock('../hooks/use_editor_operations', () => ({ useEditorOperations: jest.fn() }));
jest.mock('../../../application/hooks', () => ({ useEditorFocus: jest.fn() }));

const mockUpdateQueryEditorState = jest.fn();
const mockSetEditorText = jest.fn();
const mockFocusOnEditor = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useEditorOperations as jest.Mock).mockReturnValue({ setEditorText: mockSetEditorText });
  (useEditorFocus as jest.Mock).mockReturnValue(mockFocusOnEditor);
});

const renderWithQuery = (lastExecutedTranslatedQuery?: string) => {
  (useQueryBuilderState as jest.Mock).mockReturnValue({
    queryEditorState: { lastExecutedTranslatedQuery },
    queryBuilder: { updateQueryEditorState: mockUpdateQueryEditorState },
  });
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
    expect(mockUpdateQueryEditorState).toHaveBeenCalledWith({
      editorMode: EditorMode.Query,
      lastExecutedTranslatedQuery: undefined,
    });
  });

  it('clicking edit focuses the editor', () => {
    renderWithQuery('source=logs');
    fireEvent.click(screen.getByTestId('exploreQueryPanelGeneratedQueryEditButton'));
    expect(mockFocusOnEditor).toHaveBeenCalledWith(true);
  });
});
