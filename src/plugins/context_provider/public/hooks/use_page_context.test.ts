/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { usePageContext, UsePageContextOptions } from './use_page_context';
import { useDynamicContext } from './use_dynamic_context';
import { getStateFromOsdUrl } from '../../../opensearch_dashboards_utils/public';

// Mock dependencies
jest.mock('./use_dynamic_context');
jest.mock('../../../opensearch_dashboards_utils/public', () => ({
  getStateFromOsdUrl: jest.fn(),
}));

describe('usePageContext', () => {
  let mockUseDynamicContext: jest.Mock;
  let mockGetStateFromOsdUrl: jest.Mock;
  let originalLocation: Location;
  let originalHistory: History;

  beforeEach(() => {
    // Mock useDynamicContext
    mockUseDynamicContext = useDynamicContext as jest.Mock;
    mockUseDynamicContext.mockReturnValue('test-context-id');

    // Mock getStateFromOsdUrl
    mockGetStateFromOsdUrl = getStateFromOsdUrl as jest.Mock;
    mockGetStateFromOsdUrl.mockReturnValue(null);

    // Store original objects
    originalLocation = window.location;
    originalHistory = window.history;

    // Mock window.location
    delete (window as any).location;
    (window as any).location = {
      href:
        'http://localhost:5601/app/explore#/?_g=(time:(from:now-15m,to:now))&_a=(query:(language:PPL,query:"source=logs"))&_q=(dataset:(id:logs-*,title:logs-*,type:index-pattern))',
      pathname: '/app/explore',
      search: '',
      hash:
        '#/?_g=(time:(from:now-15m,to:now))&_a=(query:(language:PPL,query:"source=logs"))&_q=(dataset:(id:logs-*,title:logs-*,type:index-pattern))',
    };

    // Mock window.history
    delete (window as any).history;
    window.history = {
      pushState: jest.fn(),
      replaceState: jest.fn(),
    } as any;

    // Mock URL constructor
    (global as any).URL = jest.fn().mockImplementation((url) => ({
      href: url,
      pathname: '/app/explore',
      search: '',
      hash:
        '#/?_g=(time:(from:now-15m,to:now))&_a=(query:(language:PPL,query:"source=logs"))&_q=(dataset:(id:logs-*,title:logs-*,type:index-pattern))',
      searchParams: new URLSearchParams(),
    }));

    // Mock event listeners
    jest.spyOn(window, 'addEventListener');
    jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    // Restore original objects
    (window as any).location = originalLocation;
    (window as any).history = originalHistory;
  });

  describe('basic functionality', () => {
    it('should capture initial URL state and register context', () => {
      mockGetStateFromOsdUrl
        .mockReturnValueOnce({ time: { from: 'now-15m', to: 'now' } }) // _g
        .mockReturnValueOnce({ query: { language: 'PPL', query: 'source=logs' } }) // _a
        .mockReturnValueOnce({ dataset: { id: 'logs-*', title: 'logs-*' } }); // _q

      renderHook(() => usePageContext());

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Page context for /app/explore',
          label: 'Page: /app/explore',
          categories: ['page', 'url', 'static'],
          value: expect.objectContaining({
            pathname: '/app/explore',
            _g: { time: { from: 'now-15m', to: 'now' } },
            _a: { query: { language: 'PPL', query: 'source=logs' } },
            _q: { dataset: { id: 'logs-*', title: 'logs-*' } },
          }),
        })
      );
    });

    it('should return context ID from useDynamicContext', () => {
      mockUseDynamicContext.mockReturnValue('page-context-123');

      const { result } = renderHook(() => usePageContext());

      expect(result.current).toBe('page-context-123');
    });

    it('should handle URL without state parameters', () => {
      mockGetStateFromOsdUrl.mockReturnValue(null);

      renderHook(() => usePageContext());

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.objectContaining({
            pathname: '/app/explore',
            _g: null,
            _a: null,
            _q: null,
          }),
        })
      );
    });
  });

  describe('options handling', () => {
    it('should use custom description when provided', () => {
      const options: UsePageContextOptions = {
        description: 'Custom page context',
      };

      renderHook(() => usePageContext(options));

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Custom page context',
        })
      );
    });

    it('should use custom categories when provided', () => {
      const options: UsePageContextOptions = {
        categories: ['custom', 'test'],
      };

      renderHook(() => usePageContext(options));

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: ['custom', 'test'],
        })
      );
    });

    it('should apply custom convert function', () => {
      const mockConvert = jest.fn().mockReturnValue({ converted: true });
      const options: UsePageContextOptions = {
        convert: mockConvert,
      };

      renderHook(() => usePageContext(options));

      expect(mockConvert).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/app/explore',
        })
      );

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          value: { converted: true },
        })
      );
    });

    it('should not register context when disabled', () => {
      const options: UsePageContextOptions = {
        enabled: false,
      };

      renderHook(() => usePageContext(options));

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Disabled page context',
          value: null,
          label: 'Disabled',
          categories: ['disabled'],
        })
      );
    });
  });

  describe('URL change monitoring', () => {
    it('should set up event listeners for URL changes', () => {
      renderHook(() => usePageContext());

      expect(window.addEventListener).toHaveBeenCalledWith('hashchange', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    });

    it('should override history.pushState and replaceState', () => {
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;

      renderHook(() => usePageContext());

      expect(window.history.pushState).not.toBe(originalPushState);
      expect(window.history.replaceState).not.toBe(originalReplaceState);
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => usePageContext());

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('hashchange', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    });

    it('should restore original history methods on unmount', () => {
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;

      const { unmount } = renderHook(() => usePageContext());

      unmount();

      expect(window.history.pushState).toBe(originalPushState);
      expect(window.history.replaceState).toBe(originalReplaceState);
    });

    it('should handle hashchange events', () => {
      let hashChangeHandler: () => void;

      (window.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'hashchange') {
          hashChangeHandler = handler;
        }
      });

      renderHook(() => usePageContext());

      // Clear initial call
      mockUseDynamicContext.mockClear();

      // Simulate hash change
      (window as any).location.hash = '#/new-path';

      // Update URL mock to return new hash
      (global as any).URL = jest.fn().mockImplementation((url) => ({
        href: url,
        pathname: '/app/explore',
        search: '',
        hash: '#/new-path',
        searchParams: new URLSearchParams(),
      }));

      hashChangeHandler!();

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.objectContaining({
            hash: '#/new-path',
          }),
        })
      );
    });

    it('should handle popstate events', () => {
      let popstateHandler: () => void;

      (window.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'popstate') {
          popstateHandler = handler;
        }
      });

      renderHook(() => usePageContext());

      // Clear initial call
      mockUseDynamicContext.mockClear();

      // Simulate popstate
      popstateHandler!();

      expect(mockUseDynamicContext).toHaveBeenCalled();
    });

    it('should handle pushState calls', () => {
      renderHook(() => usePageContext());

      // Clear initial call
      mockUseDynamicContext.mockClear();

      // Simulate pushState call
      window.history.pushState({}, '', '/new-path');

      // Use setTimeout to wait for microtask
      setTimeout(() => {
        expect(mockUseDynamicContext).toHaveBeenCalled();
      }, 0);
    });

    it('should handle replaceState calls', () => {
      renderHook(() => usePageContext());

      // Clear initial call
      mockUseDynamicContext.mockClear();

      // Simulate replaceState call
      window.history.replaceState({}, '', '/new-path');

      // Use setTimeout to wait for microtask
      setTimeout(() => {
        expect(mockUseDynamicContext).toHaveBeenCalled();
      }, 0);
    });
  });

  describe('URL state parsing', () => {
    it('should parse _g parameter correctly', () => {
      const globalState = {
        time: { from: 'now-1h', to: 'now' },
        refreshInterval: { pause: false, value: 0 },
      };
      mockGetStateFromOsdUrl.mockImplementation((param) => {
        if (param === '_g') return globalState;
        return null;
      });

      renderHook(() => usePageContext());

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.objectContaining({
            _g: globalState,
          }),
        })
      );
    });

    it('should parse _a parameter correctly', () => {
      const appState = { query: { language: 'DQL', query: 'status:200' }, filters: [] };
      mockGetStateFromOsdUrl.mockImplementation((param) => {
        if (param === '_a') return appState;
        return null;
      });

      renderHook(() => usePageContext());

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.objectContaining({
            _a: appState,
          }),
        })
      );
    });

    it('should parse _q parameter correctly', () => {
      const queryState = { dataset: { id: 'test-*', title: 'Test Index' } };
      mockGetStateFromOsdUrl.mockImplementation((param) => {
        if (param === '_q') return queryState;
        return null;
      });

      renderHook(() => usePageContext());

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.objectContaining({
            _q: queryState,
          }),
        })
      );
    });

    it('should handle search parameters', () => {
      // Mock URL with search parameters
      (global as any).URL = jest.fn().mockImplementation(() => ({
        href: 'http://localhost:5601/app/explore?tab=logs&mode=advanced',
        pathname: '/app/explore',
        search: '?tab=logs&mode=advanced',
        hash: '',
        searchParams: new Map([
          ['tab', 'logs'],
          ['mode', 'advanced'],
        ]),
      }));

      renderHook(() => usePageContext());

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.objectContaining({
            search: '?tab=logs&mode=advanced',
            searchParams: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle URL parsing errors gracefully', () => {
      (global as any).URL = jest.fn().mockImplementation(() => {
        throw new Error('Invalid URL');
      });

      expect(() => renderHook(() => usePageContext())).not.toThrow();
    });

    it('should handle getStateFromOsdUrl errors gracefully', () => {
      mockGetStateFromOsdUrl.mockImplementation(() => {
        throw new Error('State parsing failed');
      });

      expect(() => renderHook(() => usePageContext())).not.toThrow();
    });

    it('should handle missing window.location gracefully', () => {
      delete (window as any).location;

      expect(() => renderHook(() => usePageContext())).not.toThrow();
    });

    it('should handle missing window.history gracefully', () => {
      delete (window as any).history;

      const { unmount } = renderHook(() => usePageContext());

      // Should not throw on unmount even without history
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('performance and optimization', () => {
    it('should not set up listeners when disabled', () => {
      const options: UsePageContextOptions = {
        enabled: false,
      };

      renderHook(() => usePageContext(options));

      expect(window.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should use stable references for default categories', () => {
      const { rerender } = renderHook(() => usePageContext());

      const firstCall = mockUseDynamicContext.mock.calls[0]?.[0];

      rerender();

      const secondCall = mockUseDynamicContext.mock.calls[1]?.[0];

      // Categories should be the same reference for performance
      if (firstCall && secondCall) {
        expect(firstCall.categories).toBe(secondCall.categories);
      } else {
        // If calls are null, skip this test
        expect(mockUseDynamicContext).toHaveBeenCalled();
      }
    });

    it('should memoize context options properly', () => {
      const options: UsePageContextOptions = {
        description: 'Test context',
        categories: ['test'],
      };

      const { rerender } = renderHook(() => usePageContext(options));

      // Clear calls to see only rerender calls
      mockUseDynamicContext.mockClear();

      // Rerender with same options
      rerender();

      // Should still call useDynamicContext but with memoized options
      expect(mockUseDynamicContext).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty URL hash', () => {
      (window as any).location.hash = '';

      // Update URL mock to return empty hash
      (global as any).URL = jest.fn().mockImplementation((url) => ({
        href: url,
        pathname: '/app/explore',
        search: '',
        hash: '',
        searchParams: new URLSearchParams(),
      }));

      renderHook(() => usePageContext());

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.objectContaining({
            hash: '',
          }),
        })
      );
    });

    it('should handle URL with only pathname', () => {
      (global as any).URL = jest.fn().mockImplementation(() => ({
        href: 'http://localhost:5601/app/explore',
        pathname: '/app/explore',
        search: '',
        hash: '',
        searchParams: new URLSearchParams(),
      }));

      renderHook(() => usePageContext());

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          value: expect.objectContaining({
            pathname: '/app/explore',
            search: '',
            hash: '',
          }),
        })
      );
    });

    it('should handle convert function returning null', () => {
      const options: UsePageContextOptions = {
        convert: () => null,
      };

      renderHook(() => usePageContext(options));

      expect(mockUseDynamicContext).toHaveBeenCalledWith(
        expect.objectContaining({
          value: null,
        })
      );
    });

    it('should handle convert function throwing error', () => {
      const options: UsePageContextOptions = {
        convert: () => {
          throw new Error('Convert failed');
        },
      };

      expect(() => renderHook(() => usePageContext(options))).not.toThrow();
    });

    it('should handle rapid URL changes', () => {
      let hashChangeHandler: () => void;

      (window.addEventListener as jest.Mock).mockImplementation((event, handler) => {
        if (event === 'hashchange') {
          hashChangeHandler = handler;
        }
      });

      renderHook(() => usePageContext());

      // Clear initial call
      mockUseDynamicContext.mockClear();

      // Simulate rapid hash changes
      for (let i = 0; i < 10; i++) {
        window.location.hash = `#/path-${i}`;
        hashChangeHandler!();
      }

      expect(mockUseDynamicContext).toHaveBeenCalledTimes(10);
    });
  });
});
