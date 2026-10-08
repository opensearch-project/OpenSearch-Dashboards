/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useEditorOperations } from './use_editor_operations';
import { useQueryBuilderState } from './use_query_builder_state';
import { EditorMode } from '../../utils/state_management/types';

jest.mock('./use_query_builder_state', () => ({
  useQueryBuilderState: jest.fn(),
}));

const mockUseQueryBuilderState = jest.mocked(useQueryBuilderState);

describe('useEditorOperations', () => {
  let mockEditor: any;
  let mockModel: any;
  let mockQueryBuilder: any;

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
      getEditor: jest.fn().mockReturnValue(mockEditor),
      updateQueryEditorState: jest.fn(),
    };

    mockUseQueryBuilderState.mockReturnValue({ queryBuilder: mockQueryBuilder } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderOps = () => renderHook(() => useEditorOperations());

  describe('getEditorRef', () => {
    it('returns editor ref from queryBuilder.getEditor', () => {
      const { result } = renderOps();
      expect(result.current.getEditorRef()).toBe(mockEditor);
      expect(mockQueryBuilder.getEditor).toHaveBeenCalled();
    });

    it('returns null when no editor is set', () => {
      mockQueryBuilder.getEditor.mockReturnValue(null);
      const { result } = renderOps();
      expect(result.current.getEditorRef()).toBeNull();
    });
  });

  describe('focusEditor', () => {
    it('focuses editor and positions cursor at end', () => {
      const { result } = renderOps();
      act(() => {
        result.current.focusEditor();
        jest.runAllTimers();
      });
      expect(mockEditor.focus).toHaveBeenCalled();
      expect(mockEditor.setPosition).toHaveBeenCalledWith({ lineNumber: 1, column: 12 });
    });

    it('focuses editor and selects all when selectAll is true', () => {
      const { result } = renderOps();
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
      const { result } = renderOps();
      act(() => {
        result.current.focusEditor();
        jest.runAllTimers();
      });
      expect(mockEditor.setPosition).toHaveBeenCalledWith({ lineNumber: 3, column: 25 });
    });

    it('handles null editor gracefully', () => {
      mockQueryBuilder.getEditor.mockReturnValue(null);
      const { result } = renderOps();
      expect(
        act(() => {
          result.current.focusEditor();
          jest.runAllTimers();
        })
      ).resolves.not.toThrow();
    });

    it('handles editor without model gracefully', () => {
      mockEditor.getModel.mockReturnValue(null);
      const { result } = renderOps();
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
      const { result } = renderOps();
      expect(result.current.getEditorText()).toBe('source=metrics | head 10');
      expect(mockEditor.getValue).toHaveBeenCalled();
    });
  });

  describe('setEditorText', () => {
    it('sets text in editor with string value', () => {
      const { result } = renderOps();
      act(() => {
        result.current.setEditorText('source=metrics');
      });
      expect(mockEditor.setValue).toHaveBeenCalledWith('source=metrics');
    });

    it('sets text using function callback', () => {
      mockEditor.getValue.mockReturnValue('source=logs');
      const { result } = renderOps();
      act(() => {
        result.current.setEditorText((prev) => `${prev} | head 10`);
      });
      expect(mockEditor.setValue).toHaveBeenCalledWith('source=logs | head 10');
    });

    it('handles empty string', () => {
      const { result } = renderOps();
      act(() => {
        result.current.setEditorText('');
      });
      expect(mockEditor.setValue).toHaveBeenCalledWith('');
    });
  });

  describe('switchEditorMode', () => {
    it('updates editor mode and selects all text in editor', () => {
      const { result } = renderOps();
      act(() => {
        result.current.switchEditorMode(EditorMode.Prompt);
        jest.runAllTimers();
      });
      expect(mockQueryBuilder.updateQueryEditorState).toHaveBeenCalledWith({
        editorMode: EditorMode.Prompt,
      });
      expect(mockEditor.setSelection).toHaveBeenCalledWith({ mock: 'range' });
    });

    it('does nothing to selection when editor has no model', () => {
      mockEditor.getModel.mockReturnValue(null);
      const { result } = renderOps();
      act(() => {
        result.current.switchEditorMode(EditorMode.Query);
        jest.runAllTimers();
      });
      expect(mockEditor.setSelection).not.toHaveBeenCalled();
    });
  });

  describe('clearEditor', () => {
    it('clears editor text', () => {
      const { result } = renderOps();
      act(() => {
        result.current.clearEditor();
      });
      expect(mockEditor.setValue).toHaveBeenCalledWith('');
    });
  });

  describe('return value', () => {
    it('returns object with all expected operations', () => {
      const { result } = renderOps();
      expect(result.current).toHaveProperty('getEditorRef');
      expect(result.current).toHaveProperty('focusEditor');
      expect(result.current).toHaveProperty('getEditorText');
      expect(result.current).toHaveProperty('setEditorText');
      expect(result.current).toHaveProperty('switchEditorMode');
      expect(result.current).toHaveProperty('clearEditor');
    });

    it('all operations are functions', () => {
      const { result } = renderOps();
      expect(typeof result.current.getEditorRef).toBe('function');
      expect(typeof result.current.focusEditor).toBe('function');
      expect(typeof result.current.getEditorText).toBe('function');
      expect(typeof result.current.setEditorText).toBe('function');
      expect(typeof result.current.switchEditorMode).toBe('function');
      expect(typeof result.current.clearEditor).toBe('function');
    });
  });
});
