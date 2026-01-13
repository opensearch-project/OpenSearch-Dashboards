/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { monaco } from '@osd/monaco';
import { useMultiQueryDecorations } from './use_multi_query_decorations';

// Mock monaco
jest.mock('@osd/monaco', () => {
  const MockRange = function (
    this: any,
    mockStartLineNumber: number,
    mockStartColumn: number,
    mockEndLineNumber: number,
    mockEndColumn: number
  ) {
    this.startLineNumber = mockStartLineNumber;
    this.startColumn = mockStartColumn;
    this.endLineNumber = mockEndLineNumber;
    this.endColumn = mockEndColumn;
  };
  return {
    monaco: {
      Range: MockRange,
      editor: {
        TrackedRangeStickiness: {
          NeverGrowsWhenTypingAtEdges: 1,
        },
      },
    },
  };
});

describe('useMultiQueryDecorations', () => {
  let mockEditor: any;
  let mockModel: any;
  let mockCollection: any;

  beforeEach(() => {
    mockModel = {
      getValue: jest.fn(),
    };
    mockCollection = {
      set: jest.fn(),
      clear: jest.fn(),
    };
    mockEditor = {
      getModel: jest.fn().mockReturnValue(mockModel),
      createDecorationsCollection: jest.fn().mockReturnValue(mockCollection),
    };
    // Clean up DOM
    const styleEl = document.getElementById('query-label-dynamic-styles');
    if (styleEl) {
      styleEl.remove();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return updateDecorations and clearDecorations functions', () => {
    const { result } = renderHook(() => useMultiQueryDecorations());

    expect(typeof result.current.updateDecorations).toBe('function');
    expect(typeof result.current.clearDecorations).toBe('function');
  });

  it('should not apply decorations for non-PROMQL language', () => {
    const { result } = renderHook(() => useMultiQueryDecorations());

    act(() => {
      result.current.updateDecorations(mockEditor, 'SQL');
    });

    // Should clear decorations for non-PROMQL
    expect(mockCollection.clear).toHaveBeenCalled();
    expect(mockEditor.getModel).not.toHaveBeenCalled();
  });

  it('should clear existing decorations when switching from PROMQL to another language', () => {
    mockModel.getValue.mockReturnValue('up; down');
    const { result } = renderHook(() => useMultiQueryDecorations());

    // First apply decorations for PROMQL
    act(() => {
      result.current.updateDecorations(mockEditor, 'PROMQL');
    });

    // Then switch to SQL - should clear decorations
    act(() => {
      result.current.updateDecorations(mockEditor, 'SQL');
    });

    // collection.clear() should be called
    expect(mockCollection.clear).toHaveBeenCalled();
  });

  it('should not show label for single query', () => {
    mockModel.getValue.mockReturnValue('up{job="test"}');
    const { result } = renderHook(() => useMultiQueryDecorations());

    act(() => {
      result.current.updateDecorations(mockEditor, 'PROMQL');
    });

    // For single query, decorations should be cleared (cleaner UX)
    expect(mockCollection.clear).toHaveBeenCalled();
    expect(mockCollection.set).not.toHaveBeenCalled();
  });

  it('should apply decorations for multiple queries', () => {
    // Put queries on different lines so they get separate decorations
    mockModel.getValue.mockReturnValue('up;\ndown');
    const { result } = renderHook(() => useMultiQueryDecorations());

    act(() => {
      result.current.updateDecorations(mockEditor, 'PROMQL');
    });

    expect(mockCollection.set).toHaveBeenCalled();
    const decorations = mockCollection.set.mock.calls[0][0];

    // Should have 2 decorations (one per line)
    expect(decorations.length).toBe(2);
    expect(decorations[0].options.glyphMarginClassName).toContain('query-label-gutter');
  });

  it('should create decorations with correct line numbers', () => {
    mockModel.getValue.mockReturnValue('up;\ndown');
    const { result } = renderHook(() => useMultiQueryDecorations());

    act(() => {
      result.current.updateDecorations(mockEditor, 'PROMQL');
    });

    const decorations = mockCollection.set.mock.calls[0][0];

    // First query on line 1, second on line 2
    expect(decorations[0].range.startLineNumber).toBe(1);
    expect(decorations[1].range.startLineNumber).toBe(2);
  });

  it('should combine labels when multiple queries start on same line', () => {
    // Two queries on same line: "up; down" - both parsed queries start at line 1
    mockModel.getValue.mockReturnValue('up; down');
    const { result } = renderHook(() => useMultiQueryDecorations());

    act(() => {
      result.current.updateDecorations(mockEditor, 'PROMQL');
    });

    const decorations = mockCollection.set.mock.calls[0][0];

    // Both queries are on line 1, so should be combined into one decoration
    expect(decorations.length).toBe(1);
    // The glyph should show combined label "A,B"
    expect(decorations[0].options.glyphMarginClassName).toContain('query-label-gutter--A_B');
  });

  it('should handle null editor gracefully', () => {
    const { result } = renderHook(() => useMultiQueryDecorations());

    expect(() => {
      act(() => {
        result.current.updateDecorations(null, 'PROMQL');
      });
    }).not.toThrow();
  });

  it('should handle null model gracefully', () => {
    mockEditor.getModel.mockReturnValue(null);
    const { result } = renderHook(() => useMultiQueryDecorations());

    expect(() => {
      act(() => {
        result.current.updateDecorations(mockEditor, 'PROMQL');
      });
    }).not.toThrow();
  });

  it('clearDecorations should remove all decorations', () => {
    mockModel.getValue.mockReturnValue('up; down');
    const { result } = renderHook(() => useMultiQueryDecorations());

    // Apply decorations
    act(() => {
      result.current.updateDecorations(mockEditor, 'PROMQL');
    });

    // Clear decorations
    act(() => {
      result.current.clearDecorations(mockEditor);
    });

    expect(mockCollection.clear).toHaveBeenCalled();
  });

  it('clearDecorations should handle null editor', () => {
    const { result } = renderHook(() => useMultiQueryDecorations());

    expect(() => {
      act(() => {
        result.current.clearDecorations(null);
      });
    }).not.toThrow();
  });

  it('should apply decorations with hover messages', () => {
    mockModel.getValue.mockReturnValue('up;\ndown');
    const { result } = renderHook(() => useMultiQueryDecorations());

    act(() => {
      result.current.updateDecorations(mockEditor, 'PROMQL');
    });

    const decorations = mockCollection.set.mock.calls[0][0];

    expect(decorations[0].options.glyphMarginHoverMessage).toBeDefined();
    expect(decorations[0].options.glyphMarginHoverMessage.value).toBe('Query A');
    expect(decorations[1].options.glyphMarginHoverMessage.value).toBe('Query B');
  });

  it('should reuse existing collection for same editor', () => {
    mockModel.getValue.mockReturnValue('up;\ndown');
    const { result } = renderHook(() => useMultiQueryDecorations());

    // First update
    act(() => {
      result.current.updateDecorations(mockEditor, 'PROMQL');
    });

    // Second update with same editor
    act(() => {
      result.current.updateDecorations(mockEditor, 'PROMQL');
    });

    // Should only create collection once
    expect(mockEditor.createDecorationsCollection).toHaveBeenCalledTimes(1);
  });

  it('should create new collection when editor changes', () => {
    mockModel.getValue.mockReturnValue('up;\ndown');
    const { result } = renderHook(() => useMultiQueryDecorations());

    // First update with original editor
    act(() => {
      result.current.updateDecorations(mockEditor, 'PROMQL');
    });

    // Create a new mock editor
    const newMockCollection = { set: jest.fn(), clear: jest.fn() };
    const newMockEditor = {
      getModel: jest.fn().mockReturnValue(mockModel),
      createDecorationsCollection: jest.fn().mockReturnValue(newMockCollection),
    };

    // Update with new editor
    act(() => {
      result.current.updateDecorations(newMockEditor, 'PROMQL');
    });

    // Should create new collection for new editor
    expect(newMockEditor.createDecorationsCollection).toHaveBeenCalledTimes(1);
  });
});
