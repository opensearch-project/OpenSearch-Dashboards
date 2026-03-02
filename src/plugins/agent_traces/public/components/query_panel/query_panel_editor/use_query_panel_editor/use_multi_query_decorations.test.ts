/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { useMultiQueryDecorations } from './use_multi_query_decorations';

describe('useMultiQueryDecorations', () => {
  let mockEditor: any;
  let mockCollection: any;

  beforeEach(() => {
    mockCollection = {
      set: jest.fn(),
      clear: jest.fn(),
    };
    mockEditor = {
      getModel: jest.fn(),
      createDecorationsCollection: jest.fn().mockReturnValue(mockCollection),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return updateDecorations and clearDecorations functions', () => {
    const { result } = renderHook(() => useMultiQueryDecorations());

    expect(typeof result.current.updateDecorations).toBe('function');
    expect(typeof result.current.clearDecorations).toBe('function');
  });

  it('should clear decorations when updateDecorations is called', () => {
    const { result } = renderHook(() => useMultiQueryDecorations());

    act(() => {
      result.current.updateDecorations(mockEditor, 'PPL');
    });

    expect(mockCollection.clear).toHaveBeenCalled();
  });

  it('should handle null editor gracefully in updateDecorations', () => {
    const { result } = renderHook(() => useMultiQueryDecorations());

    expect(() => {
      act(() => {
        result.current.updateDecorations(null, 'PPL');
      });
    }).not.toThrow();
  });

  it('clearDecorations should remove all decorations', () => {
    const { result } = renderHook(() => useMultiQueryDecorations());

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

  it('should reuse existing collection for same editor', () => {
    const { result } = renderHook(() => useMultiQueryDecorations());

    act(() => {
      result.current.updateDecorations(mockEditor, 'PPL');
    });

    act(() => {
      result.current.updateDecorations(mockEditor, 'PPL');
    });

    expect(mockEditor.createDecorationsCollection).toHaveBeenCalledTimes(1);
  });

  it('should create new collection when editor changes', () => {
    const { result } = renderHook(() => useMultiQueryDecorations());

    act(() => {
      result.current.updateDecorations(mockEditor, 'PPL');
    });

    const newMockCollection = { set: jest.fn(), clear: jest.fn() };
    const newMockEditor = {
      getModel: jest.fn(),
      createDecorationsCollection: jest.fn().mockReturnValue(newMockCollection),
    };

    act(() => {
      result.current.updateDecorations(newMockEditor, 'PPL');
    });

    expect(newMockEditor.createDecorationsCollection).toHaveBeenCalledTimes(1);
  });
});
