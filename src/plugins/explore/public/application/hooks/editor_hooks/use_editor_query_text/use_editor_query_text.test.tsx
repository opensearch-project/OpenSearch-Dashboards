/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useEditorQueryText } from './use_editor_query_text';
import { EditorContext } from '../../../context';
import { EditorMode } from '../../../utils/state_management/types';

jest.mock('../../../utils/state_management/selectors', () => ({
  selectEditorMode: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: (selector: any) => selector(),
}));

import { selectEditorMode } from '../../../utils/state_management/selectors';

const mockSelectEditorMode = selectEditorMode as jest.MockedFunction<typeof selectEditorMode>;

describe('useEditorQueryText', () => {
  const createMockStore = () => {
    return configureStore({
      reducer: {
        root: (state = {}) => state,
      },
    });
  };

  const createWrapper = (topEditorText: string = '', bottomEditorText: string = '') => {
    const store = createMockStore();
    const mockContextValue = {
      topEditorRef: { current: null },
      bottomEditorRef: { current: null },
      topEditorText,
      setTopEditorText: jest.fn(),
      bottomEditorText,
      setBottomEditorText: jest.fn(),
    };

    return ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <EditorContext.Provider value={mockContextValue as any}>{children}</EditorContext.Provider>
      </Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SingleQuery mode', () => {
    it('returns topEditorText when editor mode is SingleQuery', () => {
      const queryText = 'SELECT * FROM logs';
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
      const wrapper = createWrapper(queryText, 'bottom text');

      const { result } = renderHook(() => useEditorQueryText(), { wrapper });

      expect(result.current).toBe(queryText);
    });

    it('returns empty topEditorText when no top text is provided in SingleQuery mode', () => {
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
      const wrapper = createWrapper('', 'bottom text');

      const { result } = renderHook(() => useEditorQueryText(), { wrapper });

      expect(result.current).toBe('');
    });
  });

  describe('SingleEmpty mode', () => {
    it('returns topEditorText when editor mode is SingleEmpty', () => {
      const queryText = 'SELECT COUNT(*) FROM table';
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleEmpty);
      const wrapper = createWrapper(queryText, 'bottom text');

      const { result } = renderHook(() => useEditorQueryText(), { wrapper });

      expect(result.current).toBe(queryText);
    });

    it('returns empty topEditorText when no top text is provided in SingleEmpty mode', () => {
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleEmpty);
      const wrapper = createWrapper('', 'bottom text');

      const { result } = renderHook(() => useEditorQueryText(), { wrapper });

      expect(result.current).toBe('');
    });
  });

  describe('Other editor modes', () => {
    it('returns bottomEditorText when editor mode is DualQuery', () => {
      const bottomText = 'SELECT * FROM logs WHERE level = "error"';
      mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
      const wrapper = createWrapper('top text', bottomText);

      const { result } = renderHook(() => useEditorQueryText(), { wrapper });

      expect(result.current).toBe(bottomText);
    });

    it('returns bottomEditorText when editor mode is DualPrompt', () => {
      const bottomText = 'Show me all error logs from the last hour';
      mockSelectEditorMode.mockReturnValue(EditorMode.DualPrompt);
      const wrapper = createWrapper('top text', bottomText);

      const { result } = renderHook(() => useEditorQueryText(), { wrapper });

      expect(result.current).toBe(bottomText);
    });

    it('returns empty bottomEditorText when no bottom text is provided in dual modes', () => {
      mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
      const wrapper = createWrapper('top text', '');

      const { result } = renderHook(() => useEditorQueryText(), { wrapper });

      expect(result.current).toBe('');
    });
  });

  describe('Mode switching', () => {
    it('updates result when editor mode changes from SingleQuery to DualQuery', () => {
      const topText = 'top query';
      const bottomText = 'bottom query';
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
      const wrapper = createWrapper(topText, bottomText);

      const { result, rerender } = renderHook(() => useEditorQueryText(), { wrapper });

      expect(result.current).toBe(topText);

      mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
      rerender();

      expect(result.current).toBe(bottomText);
    });

    it('updates result when editor mode changes from DualPrompt to SingleEmpty', () => {
      const topText = 'SELECT * FROM table';
      const bottomText = 'Show me data from table';
      mockSelectEditorMode.mockReturnValue(EditorMode.DualPrompt);
      const wrapper = createWrapper(topText, bottomText);

      const { result, rerender } = renderHook(() => useEditorQueryText(), { wrapper });

      expect(result.current).toBe(bottomText);

      mockSelectEditorMode.mockReturnValue(EditorMode.SingleEmpty);
      rerender();

      expect(result.current).toBe(topText);
    });
  });

  describe('Text changes', () => {
    it('returns different results with different topEditorText in SingleQuery mode', () => {
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
      const initialText = 'initial query';
      const updatedText = 'updated query';

      const { result: result1 } = renderHook(() => useEditorQueryText(), {
        wrapper: createWrapper(initialText, 'bottom'),
      });

      expect(result1.current).toBe(initialText);

      const { result: result2 } = renderHook(() => useEditorQueryText(), {
        wrapper: createWrapper(updatedText, 'bottom'),
      });

      expect(result2.current).toBe(updatedText);
    });

    it('returns different results with different bottomEditorText in DualQuery mode', () => {
      mockSelectEditorMode.mockReturnValue(EditorMode.DualQuery);
      const initialText = 'initial bottom query';
      const updatedText = 'updated bottom query';

      const { result: result1 } = renderHook(() => useEditorQueryText(), {
        wrapper: createWrapper('top', initialText),
      });

      expect(result1.current).toBe(initialText);

      const { result: result2 } = renderHook(() => useEditorQueryText(), {
        wrapper: createWrapper('top', updatedText),
      });

      expect(result2.current).toBe(updatedText);
    });
  });

  describe('Memoization', () => {
    it('returns the same reference when dependencies do not change', () => {
      const topText = 'SELECT * FROM logs';
      const bottomText = 'bottom query';
      mockSelectEditorMode.mockReturnValue(EditorMode.SingleQuery);
      const wrapper = createWrapper(topText, bottomText);

      const { result, rerender } = renderHook(() => useEditorQueryText(), { wrapper });
      const firstResult = result.current;

      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });
  });
});
