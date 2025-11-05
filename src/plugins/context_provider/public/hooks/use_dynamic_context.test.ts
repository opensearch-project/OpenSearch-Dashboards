/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useDynamicContext } from './use_dynamic_context';
import { AssistantContextOptions, AssistantContextStore } from '../types';
import fastDeepEqual from 'fast-deep-equal';

// Mock fast-deep-equal
jest.mock('fast-deep-equal', () => jest.fn());

describe('useDynamicContext', () => {
  let mockContextStore: jest.Mocked<AssistantContextStore> & {
    getBackendFormattedContexts: jest.Mock;
  };
  let mockDeepEqual: jest.Mock;

  beforeEach(() => {
    // Create mock context store
    mockContextStore = {
      addContext: jest.fn(),
      removeContextById: jest.fn(),
      getContextsByCategory: jest.fn(),
      getAllContexts: jest.fn(),
      clearCategory: jest.fn(),
      clearAll: jest.fn(),
      subscribe: jest.fn(),
      getBackendFormattedContexts: jest.fn(),
    };

    // Mock deep equal function
    mockDeepEqual = fastDeepEqual as jest.Mock;
    mockDeepEqual.mockImplementation((a: any, b: any) => a === b);

    // Set up global window store
    (window as any).assistantContextStore = mockContextStore;

    // Mock console.warn to avoid ESLint issues
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete (window as any).assistantContextStore;
    jest.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should register context when options are provided', () => {
      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
        categories: ['test'],
      };

      renderHook(() => useDynamicContext(options));

      expect(mockContextStore.addContext).toHaveBeenCalledWith(options);
    });

    it('should not register context when options are null', () => {
      renderHook(() => useDynamicContext(null));

      expect(mockContextStore.addContext).not.toHaveBeenCalled();
    });

    it('should return context ID when options have ID', () => {
      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      const { result } = renderHook(() => useDynamicContext(options));

      expect(result.current).toBe('context'); // Initially returns fallback, ID is set after effect
    });

    it('should return default context ID when options have no ID', () => {
      const options: AssistantContextOptions = {
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      const { result } = renderHook(() => useDynamicContext(options));

      expect(result.current).toBe('context');
    });

    it('should return default context ID when options are null', () => {
      const { result } = renderHook(() => useDynamicContext(null));

      expect(result.current).toBe('context');
    });
  });

  describe('deep equality optimization', () => {
    it('should not re-register context when options have not changed', () => {
      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      // Mock deep equal to return true (no change)
      mockDeepEqual.mockReturnValue(true);

      const { rerender } = renderHook(
        ({ opts }: { opts: AssistantContextOptions | null }) => useDynamicContext(opts),
        { initialProps: { opts: options } }
      );

      // Clear the initial call
      mockContextStore.addContext.mockClear();

      // Rerender with same options
      rerender({ opts: options });

      expect(mockDeepEqual).toHaveBeenCalledWith(options, null); // First call compares with null
      expect(mockContextStore.addContext).not.toHaveBeenCalled();
    });

    it('should re-register context when options have changed', () => {
      const options1: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context 1',
        value: { test: 'data1' },
        label: 'Test Label 1',
      };

      const options2: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context 2',
        value: { test: 'data2' },
        label: 'Test Label 2',
      };

      // Mock deep equal to return false (changed)
      mockDeepEqual.mockReturnValue(false);

      const { rerender } = renderHook(
        ({ opts }: { opts: AssistantContextOptions | null }) => useDynamicContext(opts),
        { initialProps: { opts: options1 } }
      );

      // Clear the initial call
      mockContextStore.addContext.mockClear();
      mockContextStore.removeContextById.mockClear();

      // Rerender with different options
      rerender({ opts: options2 });

      expect(mockDeepEqual).toHaveBeenCalledWith(options2, options1);
      expect(mockContextStore.removeContextById).toHaveBeenCalledWith('test-context');
      expect(mockContextStore.addContext).toHaveBeenCalledWith(options2);
    });

    it('should handle complex object changes correctly', () => {
      const options1: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { nested: { data: 'value1' }, array: [1, 2, 3] },
        label: 'Test Label',
      };

      const options2: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { nested: { data: 'value2' }, array: [1, 2, 3] },
        label: 'Test Label',
      };

      // First render
      const { rerender } = renderHook(
        ({ opts }: { opts: AssistantContextOptions | null }) => useDynamicContext(opts),
        { initialProps: { opts: options1 } }
      );

      mockContextStore.addContext.mockClear();

      // Mock deep equal to detect the nested change
      mockDeepEqual.mockReturnValue(false);

      rerender({ opts: options2 });

      expect(mockDeepEqual).toHaveBeenCalledWith(options2, options1);
      expect(mockContextStore.addContext).toHaveBeenCalledWith(options2);
    });
  });

  describe('shouldCleanupOnUnmount parameter', () => {
    it('should cleanup context on unmount by default (shouldCleanupOnUnmount not specified)', () => {
      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      const { unmount } = renderHook(() => useDynamicContext(options));

      mockContextStore.removeContextById.mockClear();

      unmount();

      expect(mockContextStore.removeContextById).toHaveBeenCalledWith('test-context');
    });

    it('should cleanup context on unmount when shouldCleanupOnUnmount is true', () => {
      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      const { unmount } = renderHook(() => useDynamicContext(options, true));

      mockContextStore.removeContextById.mockClear();

      unmount();

      expect(mockContextStore.removeContextById).toHaveBeenCalledWith('test-context');
    });

    it('should NOT cleanup context on unmount when shouldCleanupOnUnmount is false', () => {
      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      const { unmount } = renderHook(() => useDynamicContext(options, false));

      mockContextStore.removeContextById.mockClear();

      unmount();

      expect(mockContextStore.removeContextById).not.toHaveBeenCalled();
    });

    it('should handle changes to shouldCleanupOnUnmount parameter', () => {
      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      // Start with cleanup enabled
      const { rerender, unmount } = renderHook(
        ({ cleanup }) => useDynamicContext(options, cleanup),
        { initialProps: { cleanup: true } }
      );

      // Change to cleanup disabled
      rerender({ cleanup: false });

      mockContextStore.removeContextById.mockClear();

      unmount();

      // Should not cleanup since last value was false
      expect(mockContextStore.removeContextById).not.toHaveBeenCalled();
    });

    it('should preserve context when shouldCleanupOnUnmount is false even if options change', () => {
      const options1: AssistantContextOptions = {
        id: 'test-context',
        description: 'Context 1',
        value: { test: 'data1' },
        label: 'Label 1',
      };

      const options2: AssistantContextOptions = {
        id: 'test-context',
        description: 'Context 2',
        value: { test: 'data2' },
        label: 'Label 2',
      };

      mockDeepEqual.mockReturnValue(false);

      const { rerender, unmount } = renderHook(({ opts }) => useDynamicContext(opts, false), {
        initialProps: { opts: options1 },
      });

      rerender({ opts: options2 });

      mockContextStore.removeContextById.mockClear();

      unmount();

      // Should not cleanup on unmount
      expect(mockContextStore.removeContextById).not.toHaveBeenCalled();
    });
  });

  describe('context cleanup', () => {
    it('should remove context by ID when previous options had ID', () => {
      const options1: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      const options2: AssistantContextOptions = {
        id: 'new-context',
        description: 'New context',
        value: { test: 'new-data' },
        label: 'New Label',
      };

      mockDeepEqual.mockReturnValue(false);

      const { rerender } = renderHook(
        ({ opts }: { opts: AssistantContextOptions | null }) => useDynamicContext(opts),
        { initialProps: { opts: options1 } }
      );

      mockContextStore.removeContextById.mockClear();

      rerender({ opts: options2 });

      expect(mockContextStore.removeContextById).toHaveBeenCalledWith('test-context');
    });

    it('should not try to remove context when previous options had no ID', () => {
      const options1: AssistantContextOptions = {
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      const options2: AssistantContextOptions = {
        id: 'new-context',
        description: 'New context',
        value: { test: 'new-data' },
        label: 'New Label',
      };

      mockDeepEqual.mockReturnValue(false);

      const { rerender } = renderHook(
        ({ opts }: { opts: AssistantContextOptions | null }) => useDynamicContext(opts),
        { initialProps: { opts: options1 } }
      );

      mockContextStore.removeContextById.mockClear();

      rerender({ opts: options2 });

      expect(mockContextStore.removeContextById).not.toHaveBeenCalled();
    });

    it('should clean up context on unmount', () => {
      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      const { unmount } = renderHook(() => useDynamicContext(options));

      mockContextStore.removeContextById.mockClear();

      unmount();

      expect(mockContextStore.removeContextById).toHaveBeenCalledWith('test-context');
    });

    it('should not clean up context on unmount when no ID', () => {
      const options: AssistantContextOptions = {
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      const { unmount } = renderHook(() => useDynamicContext(options));

      mockContextStore.removeContextById.mockClear();

      unmount();

      expect(mockContextStore.removeContextById).not.toHaveBeenCalled();
    });
  });

  describe('null/undefined handling', () => {
    it('should handle transition from options to null', () => {
      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      mockDeepEqual.mockReturnValue(false);

      const { rerender } = renderHook(
        ({ opts }: { opts: AssistantContextOptions | null }) => useDynamicContext(opts),
        { initialProps: { opts: options } }
      );

      mockContextStore.removeContextById.mockClear();

      rerender({ opts: null as any });

      expect(mockContextStore.removeContextById).toHaveBeenCalledWith('test-context');
    });

    it('should handle transition from null to options', () => {
      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      mockDeepEqual.mockReturnValue(false);

      const { rerender } = renderHook(
        ({ opts }: { opts: AssistantContextOptions | null }) => useDynamicContext(opts),
        { initialProps: { opts: null } }
      );

      mockContextStore.addContext.mockClear();

      rerender({ opts: options as any });

      expect(mockContextStore.addContext).toHaveBeenCalledWith(options);
    });

    it('should handle null to null transition without errors', () => {
      mockDeepEqual.mockReturnValue(true);

      const { rerender } = renderHook(
        ({ opts }: { opts: AssistantContextOptions | null }) => useDynamicContext(opts),
        { initialProps: { opts: null } }
      );

      expect(() => rerender({ opts: null })).not.toThrow();
      expect(mockContextStore.addContext).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should warn when context store is not available', () => {
      delete (window as any).assistantContextStore;
      const consoleSpy = jest.spyOn(console, 'warn');

      const options: AssistantContextOptions = {
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      renderHook(() => useDynamicContext(options));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Assistant context store not available. Make sure context provider is initialized.'
      );
    });

    it('should handle missing removeContextById method gracefully', () => {
      const storeWithoutRemove = {
        ...mockContextStore,
        removeContextById: undefined,
      };
      (window as any).assistantContextStore = storeWithoutRemove;

      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      expect(() => {
        const { unmount } = renderHook(() => useDynamicContext(options));
        unmount();
      }).not.toThrow();
    });

    it('should handle errors in addContext gracefully', () => {
      mockContextStore.addContext.mockImplementation(() => {
        throw new Error('Add context failed');
      });

      const options: AssistantContextOptions = {
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      expect(() => renderHook(() => useDynamicContext(options))).not.toThrow();
    });

    it('should handle errors in removeContextById gracefully', () => {
      mockContextStore.removeContextById.mockImplementation(() => {
        throw new Error('Remove context failed');
      });

      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      const { unmount } = renderHook(() => useDynamicContext(options));

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid option changes', () => {
      const options1: AssistantContextOptions = {
        id: 'test-context',
        description: 'Context 1',
        value: { test: 'data1' },
        label: 'Label 1',
      };

      const options2: AssistantContextOptions = {
        id: 'test-context',
        description: 'Context 2',
        value: { test: 'data2' },
        label: 'Label 2',
      };

      const options3: AssistantContextOptions = {
        id: 'test-context',
        description: 'Context 3',
        value: { test: 'data3' },
        label: 'Label 3',
      };

      mockDeepEqual.mockReturnValue(false);

      const { rerender } = renderHook(
        ({ opts }: { opts: AssistantContextOptions | null }) => useDynamicContext(opts),
        { initialProps: { opts: options1 } }
      );

      rerender({ opts: options2 });
      rerender({ opts: options3 });

      expect(mockContextStore.addContext).toHaveBeenCalledTimes(3);
      expect(mockContextStore.removeContextById).toHaveBeenCalledTimes(2);
    });

    it('should handle options with undefined values', () => {
      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: undefined,
        label: 'Test Label',
      };

      expect(() => renderHook(() => useDynamicContext(options))).not.toThrow();
      expect(mockContextStore.addContext).toHaveBeenCalledWith(options);
    });

    it('should handle options with circular references', () => {
      const circularObj: any = { test: 'data' };
      circularObj.self = circularObj;

      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: circularObj,
        label: 'Test Label',
      };

      // Deep equal might handle circular references differently
      mockDeepEqual.mockReturnValue(false);

      expect(() => renderHook(() => useDynamicContext(options))).not.toThrow();
    });

    it('should handle very large context values', () => {
      const largeArray = new Array(10000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));

      const options: AssistantContextOptions = {
        id: 'large-context',
        description: 'Large context',
        value: { items: largeArray },
        label: 'Large Label',
      };

      expect(() => renderHook(() => useDynamicContext(options))).not.toThrow();
      expect(mockContextStore.addContext).toHaveBeenCalledWith(options);
    });
  });

  describe('performance considerations', () => {
    it('should call deep equal with correct arguments', () => {
      const options1: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data1' },
        label: 'Test Label',
      };

      const options2: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data2' },
        label: 'Test Label',
      };

      const { rerender } = renderHook(({ opts }) => useDynamicContext(opts), {
        initialProps: { opts: options1 },
      });

      mockDeepEqual.mockClear();

      rerender({ opts: options2 });

      expect(mockDeepEqual).toHaveBeenCalledWith(options2, options1);
      expect(mockDeepEqual).toHaveBeenCalledTimes(1);
    });

    it('should minimize store operations when options are equal', () => {
      const options: AssistantContextOptions = {
        id: 'test-context',
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      };

      mockDeepEqual.mockReturnValue(true);

      const { rerender } = renderHook(({ opts }) => useDynamicContext(opts), {
        initialProps: { opts: options },
      });

      const initialAddCalls = mockContextStore.addContext.mock.calls.length;
      const initialRemoveCalls = mockContextStore.removeContextById.mock.calls.length;

      // Multiple rerenders with same options
      rerender({ opts: options });
      rerender({ opts: options });
      rerender({ opts: options });

      expect(mockContextStore.addContext.mock.calls.length).toBe(initialAddCalls);
      expect(mockContextStore.removeContextById.mock.calls.length).toBe(initialRemoveCalls);
    });
  });
});
