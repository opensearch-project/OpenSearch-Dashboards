/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useEditorText } from './use_editor_text';
import { EditorContext } from '../../../context';
import { EditorMode } from '../../../utils/state_management/types';

// Mock the selector
jest.mock('../../../utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: any) => selector(),
}));

import { selectEditorMode } from '../../../utils/state_management/selectors';

const mockSelectEditorMode = selectEditorMode as jest.MockedFunction<typeof selectEditorMode>;

// Create a mock store
const createMockStore = () => {
  return configureStore({
    reducer: {
      queryEditor: (state = {}, action) => state,
    },
  });
};

describe('useEditorText', () => {
  let mockStore: ReturnType<typeof createMockStore>;

  const mockEditorContextValue = {
    topEditorText: 'SELECT * FROM top_table',
    bottomEditorText: 'SELECT * FROM bottom_table',
    setTopEditorText: jest.fn(),
    setBottomEditorText: jest.fn(),
  };

  const renderUseEditorText = (editorContextValue = mockEditorContextValue) => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={mockStore}>
        <EditorContext.Provider value={editorContextValue as any}>
          {children}
        </EditorContext.Provider>
      </Provider>
    );

    return renderHook(() => useEditorText(), { wrapper });
  };

  beforeEach(() => {
    mockStore = createMockStore();
    jest.clearAllMocks();
  });

  describe('when editorMode is DualQuery', () => {
    beforeEach(() => {
      mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
    });

    it('should return bottomEditorText', () => {
      const { result } = renderUseEditorText();

      expect(result.current).toBe('SELECT * FROM bottom_table');
    });

    it('should return updated bottomEditorText when it changes', () => {
      const { result, rerender } = renderUseEditorText();

      expect(result.current).toBe('SELECT * FROM bottom_table');

      // Update context with new bottomEditorText
      const updatedContextValue = {
        ...mockEditorContextValue,
        bottomEditorText: 'SELECT COUNT(*) FROM bottom_table',
      };

      rerender();
      const { result: newResult } = renderUseEditorText(updatedContextValue);

      expect(newResult.current).toBe('SELECT COUNT(*) FROM bottom_table');
    });
  });

  describe('when editorMode is not DualQuery', () => {
    const nonDualQueryModes = [
      EditorMode.SingleEmpty,
      EditorMode.SinglePrompt,
      EditorMode.SingleQuery,
      EditorMode.DualPrompt,
    ];

    nonDualQueryModes.forEach((mode) => {
      describe(`when editorMode is ${mode}`, () => {
        beforeEach(() => {
          mockSelectEditorMode.mockReturnValue(mode);
        });

        it('should return topEditorText', () => {
          const { result } = renderUseEditorText();

          expect(result.current).toBe('SELECT * FROM top_table');
        });

        it('should return updated topEditorText when it changes', () => {
          const { result } = renderUseEditorText();

          expect(result.current).toBe('SELECT * FROM top_table');

          // Update context with new topEditorText
          const updatedContextValue = {
            ...mockEditorContextValue,
            topEditorText: 'SELECT COUNT(*) FROM top_table',
          };

          const { result: newResult } = renderUseEditorText(updatedContextValue);

          expect(newResult.current).toBe('SELECT COUNT(*) FROM top_table');
        });
      });
    });
  });
});
