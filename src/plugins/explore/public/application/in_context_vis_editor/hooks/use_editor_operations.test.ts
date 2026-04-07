/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { EditorMode } from '../../utils/state_management/types';
import { useEditorOperations } from './use_editor_operations';
import { useQueryBuilderState } from './use_query_builder_state';

// Mock the problematic dependency chain
jest.mock('../query_builder/query_builder', () => ({
  getQueryBuilder: jest.fn(),
}));

jest.mock('./use_query_builder_state', () => ({
  useQueryBuilderState: jest.fn(),
}));

describe('useEditorOperations', () => {
  let mockQueryBuilder: any;
  let mockEditor: any;
  let mockModel: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockModel = {
      getValue: jest.fn().mockReturnValue('source=logs'),
      getFullModelRange: jest.fn().mockReturnValue({ mock: 'range' }),
      getLineCount: jest.fn().mockReturnValue(1),
      getLineMaxColumn: jest.fn().mockReturnValue(12),
    };

    mockEditor = {
      getValue: jest.fn().mockReturnValue('source=logs'),
      setValue: jest.fn(),
      focus: jest.fn(),
      setSelection: jest.fn(),
      setPosition: jest.fn(),
      getModel: jest.fn().mockReturnValue(mockModel),
    };

    mockQueryBuilder = {
      getEditorRef: jest.fn().mockReturnValue(mockEditor),
      setEditorRef: jest.fn(),
      updateQueryEditorState: jest.fn(),
    };

    (useQueryBuilderState as jest.Mock).mockReturnValue({
      queryBuilder: mockQueryBuilder,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getEditorRef', () => {
    it('returns editor ref from queryBuilder', () => {
      const { result } = renderHook(() => useEditorOperations());

      const editorRef = result.current.getEditorRef();

      expect(editorRef).toBe(mockEditor);
      expect(mockQueryBuilder.getEditorRef).toHaveBeenCalled();
    });

    it('returns null when no editor is set', () => {
      mockQueryBuilder.getEditorRef.mockReturnValue(null);

      const { result } = renderHook(() => useEditorOperations());

      const editorRef = result.current.getEditorRef();

      expect(editorRef).toBeNull();
    });
  });

  describe('setEditorRef', () => {
    it('sets editor ref in queryBuilder', () => {
      const { result } = renderHook(() => useEditorOperations());

      act(() => {
        result.current.setEditorRef(mockEditor);
      });

      expect(mockQueryBuilder.setEditorRef).toHaveBeenCalledWith(mockEditor);
    });

    it('can set editor ref to null', () => {
      const { result } = renderHook(() => useEditorOperations());

      act(() => {
        result.current.setEditorRef(null);
      });

      expect(mockQueryBuilder.setEditorRef).toHaveBeenCalledWith(null);
    });
  });

  describe('focusEditor', () => {
    it('focuses editor and positions cursor at end', () => {
      const { result } = renderHook(() => useEditorOperations());

      act(() => {
        result.current.focusEditor();
        jest.runAllTimers();
      });

      expect(mockEditor.focus).toHaveBeenCalled();
      expect(mockEditor.setPosition).toHaveBeenCalledWith({
        lineNumber: 1,
        column: 12,
      });
    });

    it('focuses editor and selects all when selectAll is true', () => {
      const { result } = renderHook(() => useEditorOperations());

      act(() => {
        result.current.focusEditor(true);
        jest.runAllTimers();
      });

      expect(mockEditor.focus).toHaveBeenCalled();
      expect(mockEditor.setSelection).toHaveBeenCalledWith({ mock: 'range' });
      expect(mockEditor.setPosition).not.toHaveBeenCalled();
    });

    it('handles editor with multiple lines', () => {
      mockModel.getLineCount.mockReturnValue(3);
      mockModel.getLineMaxColumn.mockReturnValue(25);

      const { result } = renderHook(() => useEditorOperations());

      act(() => {
        result.current.focusEditor();
        jest.runAllTimers();
      });

      expect(mockEditor.setPosition).toHaveBeenCalledWith({
        lineNumber: 3,
        column: 25,
      });
    });

    it('handles null editor gracefully', () => {
      mockQueryBuilder.getEditorRef.mockReturnValue(null);

      const { result } = renderHook(() => useEditorOperations());

      expect(
        act(() => {
          result.current.focusEditor();
          jest.runAllTimers();
        })
      ).resolves.not.toThrow();
    });

    it('handles editor without model gracefully', () => {
      mockEditor.getModel.mockReturnValue(null);

      const { result } = renderHook(() => useEditorOperations());

      act(() => {
        result.current.focusEditor();
        jest.runAllTimers();
      });

      expect(mockEditor.focus).toHaveBeenCalled();
      expect(mockEditor.setPosition).not.toHaveBeenCalled();
    });
  });

  describe('getEditorText', () => {
    it('returns text from editor', () => {
      mockEditor.getValue.mockReturnValue('source=metrics | head 10');

      const { result } = renderHook(() => useEditorOperations());

      const text = result.current.getEditorText();

      expect(text).toBe('source=metrics | head 10');
      expect(mockEditor.getValue).toHaveBeenCalled();
    });
  });

  describe('setEditorText', () => {
    it('sets text in editor with string value', () => {
      const { result } = renderHook(() => useEditorOperations());

      act(() => {
        result.current.setEditorText('source=metrics');
      });

      expect(mockEditor.setValue).toHaveBeenCalledWith('source=metrics');
    });

    it('sets text using function callback', () => {
      mockEditor.getValue.mockReturnValue('source=logs');

      const { result } = renderHook(() => useEditorOperations());

      act(() => {
        result.current.setEditorText((prev) => `${prev} | head 10`);
      });

      expect(mockEditor.setValue).toHaveBeenCalledWith('source=logs | head 10');
    });

    it('handles empty string', () => {
      const { result } = renderHook(() => useEditorOperations());

      act(() => {
        result.current.setEditorText('');
      });

      expect(mockEditor.setValue).toHaveBeenCalledWith('');
    });
  });

  describe('switchEditorMode', () => {
    it('switches to Prompt mode and updates state', () => {
      const { result } = renderHook(() => useEditorOperations());

      act(() => {
        result.current.switchEditorMode(EditorMode.Prompt);
        jest.runAllTimers();
      });

      expect(mockQueryBuilder.updateQueryEditorState).toHaveBeenCalledWith({
        editorMode: EditorMode.Prompt,
      });
      expect(mockEditor.setSelection).toHaveBeenCalledWith({ mock: 'range' });
    });

    it('switches to Query mode', () => {
      const { result } = renderHook(() => useEditorOperations());

      act(() => {
        result.current.switchEditorMode(EditorMode.Query);
        jest.runAllTimers();
      });

      expect(mockQueryBuilder.updateQueryEditorState).toHaveBeenCalledWith({
        editorMode: EditorMode.Query,
      });
    });
  });

  describe('clearEditor', () => {
    it('clears editor text and resets mode', () => {
      const { result } = renderHook(() => useEditorOperations());

      act(() => {
        result.current.clearEditor();
      });

      expect(mockEditor.setValue).toHaveBeenCalledWith('');
      expect(mockQueryBuilder.updateQueryEditorState).toHaveBeenCalledWith({
        editorMode: EditorMode.Query,
      });
    });
  });

  describe('return value', () => {
    it('returns object with all expected operations', () => {
      const { result } = renderHook(() => useEditorOperations());

      expect(result.current).toHaveProperty('getEditorRef');
      expect(result.current).toHaveProperty('setEditorRef');
      expect(result.current).toHaveProperty('focusEditor');
      expect(result.current).toHaveProperty('getEditorText');
      expect(result.current).toHaveProperty('setEditorText');
      expect(result.current).toHaveProperty('switchEditorMode');
      expect(result.current).toHaveProperty('clearEditor');
    });

    it('all operations are functions', () => {
      const { result } = renderHook(() => useEditorOperations());

      expect(typeof result.current.getEditorRef).toBe('function');
      expect(typeof result.current.setEditorRef).toBe('function');
      expect(typeof result.current.focusEditor).toBe('function');
      expect(typeof result.current.getEditorText).toBe('function');
      expect(typeof result.current.setEditorText).toBe('function');
      expect(typeof result.current.switchEditorMode).toBe('function');
      expect(typeof result.current.clearEditor).toBe('function');
    });
  });
});
