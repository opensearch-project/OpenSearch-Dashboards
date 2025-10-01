/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatContextManager } from './chat_context_manager';
import { BehaviorSubject } from 'rxjs';
import { ContextProviderStart } from '../../../context_provider/public';

// Define test types
interface TestStaticContext {
  selectedText: string;
  currentPage: string;
  timestamp: number;
}

interface TestDynamicContext {
  activeFilters: string[];
  timeRange: { from: string; to: string };
  timestamp: number;
}

// Mock console methods to avoid noise in tests
const mockConsole = {
  log: jest.fn(),
};

// Mock ContextProviderStart
const mockContextProvider = {
  getStaticContext$: jest.fn(),
  getDynamicContext$: jest.fn(),
  refreshCurrentContext: jest.fn(),
} as any;

describe('ChatContextManager', () => {
  let chatContextManager: ChatContextManager;
  let staticContextSubject: BehaviorSubject<TestStaticContext | null>;
  let dynamicContextSubject: BehaviorSubject<TestDynamicContext | null>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console.log
    jest.spyOn(console, 'log').mockImplementation(mockConsole.log);

    staticContextSubject = new BehaviorSubject<TestStaticContext | null>(null);
    dynamicContextSubject = new BehaviorSubject<TestDynamicContext | null>(null);

    mockContextProvider.getStaticContext$.mockReturnValue(staticContextSubject);
    mockContextProvider.getDynamicContext$.mockReturnValue(dynamicContextSubject);

    chatContextManager = new ChatContextManager();
  });

  afterEach(() => {
    chatContextManager.stop();
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with null contexts', () => {
      expect(chatContextManager.getRawStaticContext()).toBeNull();
      expect(chatContextManager.getRawDynamicContext()).toBeNull();
    });
  });

  describe('start', () => {
    it('should start with context provider and subscribe to contexts', () => {
      chatContextManager.start(mockContextProvider);

      expect(mockContextProvider.getStaticContext$).toHaveBeenCalled();
      expect(mockContextProvider.getDynamicContext$).toHaveBeenCalled();
      expect(mockContextProvider.refreshCurrentContext).toHaveBeenCalled();
    });

    it('should handle missing context provider gracefully', () => {
      chatContextManager.start();

      expect(mockContextProvider.getStaticContext$).not.toHaveBeenCalled();
      expect(mockContextProvider.getDynamicContext$).not.toHaveBeenCalled();
    });

    it('should update static context when received', () => {
      chatContextManager.start(mockContextProvider);

      const mockStaticContext: TestStaticContext = {
        selectedText: 'test text',
        currentPage: 'test page',
        timestamp: Date.now(),
      };

      staticContextSubject.next(mockStaticContext);

      expect(chatContextManager.getRawStaticContext()).toEqual(mockStaticContext);
      expect(mockConsole.log).toHaveBeenCalledWith(
        '📊 ChatContextManager: Static context received',
        mockStaticContext
      );
    });

    it('should update dynamic context when received', () => {
      chatContextManager.start(mockContextProvider);

      const mockDynamicContext: TestDynamicContext = {
        activeFilters: ['filter1', 'filter2'],
        timeRange: { from: 'now-1h', to: 'now' },
        timestamp: Date.now(),
      };

      dynamicContextSubject.next(mockDynamicContext);

      expect(chatContextManager.getRawDynamicContext()).toEqual(mockDynamicContext);
      expect(mockConsole.log).toHaveBeenCalledWith(
        '⚡ ChatContextManager: Dynamic context received',
        mockDynamicContext
      );
    });
  });

  describe('context getters', () => {
    it('should return current static context', () => {
      const mockStaticContext: TestStaticContext = {
        selectedText: 'test',
        currentPage: 'page',
        timestamp: Date.now(),
      };

      chatContextManager.start(mockContextProvider);
      staticContextSubject.next(mockStaticContext);

      expect(chatContextManager.getRawStaticContext()).toEqual(mockStaticContext);
    });

    it('should return current dynamic context', () => {
      const mockDynamicContext: TestDynamicContext = {
        activeFilters: ['test'],
        timeRange: { from: 'now-1h', to: 'now' },
        timestamp: Date.now(),
      };

      chatContextManager.start(mockContextProvider);
      dynamicContextSubject.next(mockDynamicContext);

      expect(chatContextManager.getRawDynamicContext()).toEqual(mockDynamicContext);
    });

    it('should return observable for static context', (done) => {
      const mockStaticContext: TestStaticContext = {
        selectedText: 'test',
        currentPage: 'page',
        timestamp: Date.now(),
      };

      chatContextManager.start(mockContextProvider);

      chatContextManager.getRawStaticContext$().subscribe((context) => {
        if (context) {
          expect(context).toEqual(mockStaticContext);
          done();
        }
      });

      staticContextSubject.next(mockStaticContext);
    });

    it('should return observable for dynamic context', (done) => {
      const mockDynamicContext: TestDynamicContext = {
        activeFilters: ['test'],
        timeRange: { from: 'now-1h', to: 'now' },
        timestamp: Date.now(),
      };

      chatContextManager.start(mockContextProvider);

      chatContextManager.getRawDynamicContext$().subscribe((context) => {
        if (context) {
          expect(context).toEqual(mockDynamicContext);
          done();
        }
      });

      dynamicContextSubject.next(mockDynamicContext);
    });
  });

  describe('refreshContext', () => {
    it('should call context provider refresh when available', () => {
      chatContextManager.start(mockContextProvider);

      chatContextManager.refreshContext();

      expect(mockContextProvider.refreshCurrentContext).toHaveBeenCalledTimes(2); // Once in start, once in refresh
      expect(mockConsole.log).toHaveBeenCalledWith('🔄 ChatContextManager: Refreshing context');
    });

    it('should handle refresh when context provider is not available', () => {
      chatContextManager.refreshContext();

      expect(mockConsole.log).toHaveBeenCalledWith('🔄 ChatContextManager: Refreshing context');
    });
  });

  describe('stop', () => {
    it('should unsubscribe from all subscriptions', () => {
      chatContextManager.start(mockContextProvider);

      // Verify subscriptions are active
      expect(staticContextSubject.observers.length).toBeGreaterThan(0);
      expect(dynamicContextSubject.observers.length).toBeGreaterThan(0);

      chatContextManager.stop();

      expect(mockConsole.log).toHaveBeenCalledWith('🛑 ChatContextManager: Stopping');

      // Verify subscriptions are cleaned up
      expect(staticContextSubject.observers.length).toBe(0);
      expect(dynamicContextSubject.observers.length).toBe(0);
    });

    it('should handle stop when not started', () => {
      chatContextManager.stop();

      expect(mockConsole.log).toHaveBeenCalledWith('🛑 ChatContextManager: Stopping');
    });

    it('should handle multiple stop calls', () => {
      chatContextManager.start(mockContextProvider);

      chatContextManager.stop();
      chatContextManager.stop(); // Second call should not throw

      expect(mockConsole.log).toHaveBeenCalledWith('🛑 ChatContextManager: Stopping');
    });
  });

  describe('context updates', () => {
    it('should handle null static context', () => {
      chatContextManager.start(mockContextProvider);

      staticContextSubject.next(null);

      expect(chatContextManager.getRawStaticContext()).toBeNull();
    });

    it('should handle null dynamic context', () => {
      chatContextManager.start(mockContextProvider);

      dynamicContextSubject.next(null);

      expect(chatContextManager.getRawDynamicContext()).toBeNull();
    });

    it('should handle multiple context updates', () => {
      chatContextManager.start(mockContextProvider);

      const context1: TestStaticContext = {
        selectedText: 'first',
        currentPage: 'page1',
        timestamp: Date.now(),
      };

      const context2: TestStaticContext = {
        selectedText: 'second',
        currentPage: 'page2',
        timestamp: Date.now() + 1000,
      };

      staticContextSubject.next(context1);
      expect(chatContextManager.getRawStaticContext()).toEqual(context1);

      staticContextSubject.next(context2);
      expect(chatContextManager.getRawStaticContext()).toEqual(context2);
    });
  });
});
