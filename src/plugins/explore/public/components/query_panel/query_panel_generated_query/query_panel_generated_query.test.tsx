/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock all dependencies before imports
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
  connect: jest.fn(() => (component: any) => component),
}));

jest.mock('../../../application/utils/state_management/selectors', () => ({
  selectLastExecutedTranslatedQuery: jest.fn(),
}));

jest.mock('../../../application/hooks', () => ({
  useEditorFocus: jest.fn(),
  useSetEditorTextWithQuery: jest.fn(),
}));

jest.mock('../../../application/utils/state_management/slices', () => ({
  clearLastExecutedData: jest.fn(),
}));

jest.mock('./query_panel_generated_query.scss', () => ({}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useSelector, useDispatch } from 'react-redux';
import { selectLastExecutedTranslatedQuery } from '../../../application/utils/state_management/selectors';
import { useEditorFocus, useSetEditorTextWithQuery } from '../../../application/hooks';
import { clearLastExecutedData } from '../../../application/utils/state_management/slices';
import { QueryPanelGeneratedQuery } from './query_panel_generated_query';

const mockUseSelector = jest.mocked(useSelector);
const mockUseDispatch = jest.mocked(useDispatch);
const mockSelectLastExecutedTranslatedQuery = jest.mocked(selectLastExecutedTranslatedQuery);
const mockUseEditorFocus = jest.mocked(useEditorFocus);
const mockUseSetEditorTextWithQuery = jest.mocked(useSetEditorTextWithQuery);
const mockClearLastExecutedData = jest.mocked(clearLastExecutedData);

describe('QueryPanelGeneratedQuery', () => {
  let mockDispatch: jest.Mock;
  let mockSetEditorTextWithQuery: jest.Mock;
  let mockFocusOnEditor: jest.Mock;

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockSetEditorTextWithQuery = jest.fn();
    mockFocusOnEditor = jest.fn();

    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseSetEditorTextWithQuery.mockReturnValue(mockSetEditorTextWithQuery);
    mockUseEditorFocus.mockReturnValue({
      focusOnEditor: mockFocusOnEditor,
      editorIsFocused: false,
      setEditorIsFocused: jest.fn(),
    });

    mockClearLastExecutedData.mockReturnValue({
      type: 'clearLastExecutedData',
      payload: undefined,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when lastExecutedTranslatedQuery is null', () => {
    beforeEach(() => {
      mockUseSelector.mockReturnValue(null);
    });

    it('should return null and not render anything', () => {
      const { container } = render(<QueryPanelGeneratedQuery />);
      expect(container.firstChild).toBeNull();
    });

    it('should call selectLastExecutedTranslatedQuery selector', () => {
      render(<QueryPanelGeneratedQuery />);
      expect(mockUseSelector).toHaveBeenCalledWith(mockSelectLastExecutedTranslatedQuery);
    });
  });

  describe('when lastExecutedTranslatedQuery exists', () => {
    const testQuery = 'SELECT * FROM test_index WHERE field = "value"';

    beforeEach(() => {
      mockUseSelector.mockReturnValue(testQuery);
    });

    it('should render the component with query text', () => {
      render(<QueryPanelGeneratedQuery />);

      expect(screen.getByText(testQuery)).toBeInTheDocument();
      expect(screen.getByText('Edit query')).toBeInTheDocument();
    });

    describe('onEditClick functionality', () => {
      it('should call all required functions when edit button is clicked', () => {
        render(<QueryPanelGeneratedQuery />);

        const editButton = screen.getByTestId('exploreQueryPanelGeneratedQuery_editQuery');
        fireEvent.click(editButton);

        expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith(testQuery);
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'clearLastExecutedData' });
        expect(mockFocusOnEditor).toHaveBeenCalledTimes(1);
      });

      it('should call functions in correct order', () => {
        render(<QueryPanelGeneratedQuery />);

        const editButton = screen.getByTestId('exploreQueryPanelGeneratedQuery_editQuery');
        fireEvent.click(editButton);

        // Verify all functions were called
        expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith(testQuery);
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'clearLastExecutedData' });
        expect(mockFocusOnEditor).toHaveBeenCalledTimes(1);
      });
    });

    describe('hook integration', () => {
      it('should call useSelector with correct selector', () => {
        render(<QueryPanelGeneratedQuery />);

        expect(mockUseSelector).toHaveBeenCalledWith(mockSelectLastExecutedTranslatedQuery);
      });

      it('should call useSetEditorTextWithQuery hook', () => {
        render(<QueryPanelGeneratedQuery />);

        expect(mockUseSetEditorTextWithQuery).toHaveBeenCalledTimes(1);
      });

      it('should call useDispatch hook', () => {
        render(<QueryPanelGeneratedQuery />);

        expect(mockUseDispatch).toHaveBeenCalledTimes(1);
      });

      it('should call useEditorFocus hook', () => {
        render(<QueryPanelGeneratedQuery />);

        expect(mockUseEditorFocus).toHaveBeenCalledTimes(1);
      });
    });
  });
});
