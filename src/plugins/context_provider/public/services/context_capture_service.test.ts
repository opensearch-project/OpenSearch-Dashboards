/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { ContextCaptureService } from './context_capture_service';
import { AssistantContextStoreImpl } from './assistant_context_store';
import { CoreSetup, CoreStart } from '../../../../core/public';
import { ContextProviderSetupDeps, ContextProviderStartDeps } from '../types';

// Mock the AssistantContextStoreImpl
jest.mock('./assistant_context_store', () => ({
  AssistantContextStoreImpl: jest.fn().mockImplementation(() => ({
    clearAll: jest.fn(),
    addContext: jest.fn(),
    removeContextById: jest.fn(),
    getContextsByCategory: jest.fn(),
    getAllContexts: jest.fn(),
    clearCategory: jest.fn(),
    subscribe: jest.fn(),
    getBackendFormattedContexts: jest.fn(),
  })),
}));

function createMockCoreStart(overrides?: {
  currentAppId?: string;
  apps?: Map<string, { title: string }>;
  breadcrumbs?: Array<{ text: string }>;
}) {
  const currentAppId$ = new BehaviorSubject<string | undefined>(overrides?.currentAppId);
  const applications$ = new BehaviorSubject<ReadonlyMap<string, any>>(overrides?.apps || new Map());
  const breadcrumbs$ = new BehaviorSubject<Array<{ text: string }>>(overrides?.breadcrumbs || []);

  return {
    coreStart: ({
      application: { currentAppId$, applications$ },
      chrome: { getBreadcrumbs$: () => breadcrumbs$ },
    } as unknown) as CoreStart,
    currentAppId$,
    applications$,
    breadcrumbs$,
  };
}

describe('ContextCaptureService', () => {
  let service: ContextCaptureService;
  let mockCoreSetup: jest.Mocked<CoreSetup>;
  let mockCoreStart: jest.Mocked<CoreStart>;
  let mockPluginsSetup: jest.Mocked<ContextProviderSetupDeps>;
  let mockPluginsStart: jest.Mocked<ContextProviderStartDeps>;
  let mockAssistantContextStore: jest.Mocked<any>;

  beforeEach(() => {
    // Create mock objects
    mockCoreSetup = {} as jest.Mocked<CoreSetup>;
    mockCoreStart = createMockCoreStart().coreStart as jest.Mocked<CoreStart>;
    mockPluginsSetup = {} as jest.Mocked<ContextProviderSetupDeps>;
    mockPluginsStart = {} as jest.Mocked<ContextProviderStartDeps>;

    // Create mock store instance
    mockAssistantContextStore = {
      clearAll: jest.fn(),
      addContext: jest.fn(),
      removeContextById: jest.fn(),
      getContextsByCategory: jest.fn(),
      getAllContexts: jest.fn(),
      clearCategory: jest.fn(),
      subscribe: jest.fn(),
      getBackendFormattedContexts: jest.fn(),
    };

    // Mock the constructor to return our mock store
    (AssistantContextStoreImpl as jest.Mock).mockImplementation(() => mockAssistantContextStore);

    // Clear window object
    delete (window as any).assistantContextStore;
    delete (window as any).__defaultPageContextControl;

    service = new ContextCaptureService(mockCoreSetup, mockPluginsSetup);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete (window as any).assistantContextStore;
    delete (window as any).__defaultPageContextControl;
  });

  describe('constructor', () => {
    it('should create AssistantContextStoreImpl instance', () => {
      expect(AssistantContextStoreImpl).toHaveBeenCalledTimes(1);
      expect(service.getAssistantContextStore()).toBe(mockAssistantContextStore);
    });

    it('should store core setup and plugins setup', () => {
      // Test that the service was created without throwing
      expect(service).toBeInstanceOf(ContextCaptureService);
    });
  });

  describe('setup', () => {
    it('should complete setup without errors', () => {
      expect(() => service.setup()).not.toThrow();
    });

    it('should be idempotent - can be called multiple times', () => {
      expect(() => {
        service.setup();
        service.setup();
        service.setup();
      }).not.toThrow();
    });
  });

  describe('start', () => {
    it('should make assistant context store globally available', () => {
      service.start(mockCoreStart, mockPluginsStart);

      expect((window as any).assistantContextStore).toBe(mockAssistantContextStore);
    });

    it('should complete start without errors', () => {
      expect(() => service.start(mockCoreStart, mockPluginsStart)).not.toThrow();
    });

    it('should be idempotent - can be called multiple times', () => {
      expect(() => {
        service.start(mockCoreStart, mockPluginsStart);
        service.start(mockCoreStart, mockPluginsStart);
        service.start(mockCoreStart, mockPluginsStart);
      }).not.toThrow();

      // Should still be available globally
      expect((window as any).assistantContextStore).toBe(mockAssistantContextStore);
    });

    it('should overwrite existing global store if called multiple times', () => {
      // Set up initial global store
      const initialStore = { test: 'initial' };
      (window as any).assistantContextStore = initialStore;

      service.start(mockCoreStart, mockPluginsStart);

      expect((window as any).assistantContextStore).toBe(mockAssistantContextStore);
      expect((window as any).assistantContextStore).not.toBe(initialStore);
    });
  });

  describe('getAssistantContextStore', () => {
    it('should return the assistant context store instance', () => {
      const store = service.getAssistantContextStore();
      expect(store).toBe(mockAssistantContextStore);
    });

    it('should return the same instance on multiple calls', () => {
      const store1 = service.getAssistantContextStore();
      const store2 = service.getAssistantContextStore();

      expect(store1).toBe(store2);
      expect(store1).toBe(mockAssistantContextStore);
    });
  });

  describe('stop', () => {
    beforeEach(() => {
      service.start(mockCoreStart, mockPluginsStart);
    });

    it('should clear all contexts from the store', () => {
      service.stop();

      expect(mockAssistantContextStore.clearAll).toHaveBeenCalledTimes(1);
    });

    it('should remove global assistant context store', () => {
      expect((window as any).assistantContextStore).toBe(mockAssistantContextStore);

      service.stop();

      expect((window as any).assistantContextStore).toBeUndefined();
    });

    it('should be safe to call multiple times', () => {
      service.stop();
      service.stop();
      service.stop();

      expect(mockAssistantContextStore.clearAll).toHaveBeenCalledTimes(3);
      expect((window as any).assistantContextStore).toBeUndefined();
    });

    it('should be safe to call before start', () => {
      const freshService = new ContextCaptureService(mockCoreSetup, mockPluginsSetup);

      expect(() => freshService.stop()).not.toThrow();
      expect(mockAssistantContextStore.clearAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('service lifecycle', () => {
    it('should handle complete lifecycle: setup -> start -> stop', () => {
      // Setup
      service.setup();

      // Start
      service.start(mockCoreStart, mockPluginsStart);
      expect((window as any).assistantContextStore).toBe(mockAssistantContextStore);

      // Stop
      service.stop();
      expect(mockAssistantContextStore.clearAll).toHaveBeenCalledTimes(1);
      expect((window as any).assistantContextStore).toBeUndefined();
    });

    it('should handle restart scenario: setup -> start -> stop -> start', () => {
      // Initial lifecycle
      service.setup();
      service.start(mockCoreStart, mockPluginsStart);
      service.stop();

      // Restart
      service.start(mockCoreStart, mockPluginsStart);
      expect((window as any).assistantContextStore).toBe(mockAssistantContextStore);
    });

    it('should handle out-of-order calls gracefully', () => {
      expect(() => {
        // Start before setup
        service.start(mockCoreStart, mockPluginsStart);
        service.setup();
        service.stop();
        service.setup();
        service.start(mockCoreStart, mockPluginsStart);
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle errors in store creation gracefully', () => {
      // Mock constructor to throw error
      (AssistantContextStoreImpl as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Store creation failed');
      });

      expect(() => {
        new ContextCaptureService(mockCoreSetup, mockPluginsSetup);
      }).toThrow('Store creation failed');
    });

    it('should handle errors in clearAll during stop', () => {
      mockAssistantContextStore.clearAll.mockImplementation(() => {
        throw new Error('Clear failed');
      });

      service.start(mockCoreStart, mockPluginsStart);

      // Verify store is initially set
      expect((window as any).assistantContextStore).toBe(mockAssistantContextStore);

      // Test that stop throws the error
      expect(() => service.stop()).toThrow('Clear failed');

      // Global store should still be there since the error prevented cleanup
      expect((window as any).assistantContextStore).toBe(mockAssistantContextStore);
    });

    it('should handle missing window object gracefully', () => {
      // Mock window to be undefined (edge case)
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        service.start(mockCoreStart, mockPluginsStart);
      }).toThrow(); // This will throw because window is undefined

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('integration scenarios', () => {
    it('should work with real store methods', () => {
      // Use a real store instance for this test
      const realStore = new (jest.requireActual(
        './assistant_context_store'
      ).AssistantContextStoreImpl)();
      (AssistantContextStoreImpl as jest.Mock).mockImplementationOnce(() => realStore);

      const integrationService = new ContextCaptureService(mockCoreSetup, mockPluginsSetup);
      integrationService.setup();
      integrationService.start(mockCoreStart, mockPluginsStart);

      // Test that the real store is available globally
      expect((window as any).assistantContextStore).toBe(realStore);

      // Test that we can use store methods
      expect(() => {
        realStore.addContext({
          description: 'Test context',
          value: { test: 'data' },
          label: 'Test Label',
        });
      }).not.toThrow();

      integrationService.stop();
      expect((window as any).assistantContextStore).toBeUndefined();
    });

    it('should maintain store state between start and stop', () => {
      service.start(mockCoreStart, mockPluginsStart);

      // Simulate adding some context
      const store = service.getAssistantContextStore();
      store.addContext({
        description: 'Test context',
        value: { test: 'data' },
        label: 'Test Label',
      });

      // Store should still be the same instance
      expect(service.getAssistantContextStore()).toBe(store);
      expect((window as any).assistantContextStore).toBe(store);

      service.stop();

      // After stop, store should be cleared but instance should remain the same
      expect(service.getAssistantContextStore()).toBe(store);
      expect(mockAssistantContextStore.clearAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('memory management', () => {
    it('should not create memory leaks with multiple start/stop cycles', () => {
      for (let i = 0; i < 10; i++) {
        service.start(mockCoreStart, mockPluginsStart);
        expect((window as any).assistantContextStore).toBe(mockAssistantContextStore);
        service.stop();
        expect((window as any).assistantContextStore).toBeUndefined();
      }

      expect(mockAssistantContextStore.clearAll).toHaveBeenCalledTimes(10);
    });

    it('should properly clean up global references', () => {
      service.start(mockCoreStart, mockPluginsStart);

      // Verify global reference exists
      expect((window as any).assistantContextStore).toBeDefined();

      service.stop();

      // Verify global reference is completely removed
      expect((window as any).assistantContextStore).toBeUndefined();
      expect('assistantContextStore' in window).toBe(false);
    });
  });

  describe('default page context', () => {
    it('should register default context when currentAppId$ emits an app ID', () => {
      const apps = new Map([['dashboard', { title: 'Dashboard' }]]);
      const { coreStart, currentAppId$ } = createMockCoreStart({
        apps,
        breadcrumbs: [{ text: 'Dashboard' }],
      });

      service.start(coreStart, mockPluginsStart);

      // Emit an app ID
      currentAppId$.next('dashboard');

      expect(mockAssistantContextStore.addContext).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'default-page-context',
          description: expect.stringContaining('Page context for'),
          categories: ['page', 'static'],
          value: {
            appId: 'dashboard',
            breadcrumbs: ['Dashboard'],
          },
        })
      );

      service.stop();
    });

    it('should update context when breadcrumbs change', () => {
      const apps = new Map([['dashboard', { title: 'Dashboard' }]]);
      const { coreStart, breadcrumbs$ } = createMockCoreStart({
        currentAppId: 'dashboard',
        apps,
        breadcrumbs: [{ text: 'Dashboard' }],
      });

      service.start(coreStart, mockPluginsStart);
      mockAssistantContextStore.addContext.mockClear();

      // Update breadcrumbs
      breadcrumbs$.next([{ text: 'Dashboard' }, { text: 'Sales Overview' }]);

      expect(mockAssistantContextStore.addContext).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'default-page-context',
          value: {
            appId: 'dashboard',
            breadcrumbs: ['Dashboard', 'Sales Overview'],
          },
        })
      );

      service.stop();
    });

    it('should not register context when currentAppId$ is undefined', () => {
      const { coreStart } = createMockCoreStart();

      service.start(coreStart, mockPluginsStart);

      // No app ID emitted, so no default context should be added
      expect(mockAssistantContextStore.addContext).not.toHaveBeenCalled();

      service.stop();
    });

    it('should suppress default context and prevent re-registration', () => {
      const apps = new Map([['dashboard', { title: 'Dashboard' }]]);
      const { coreStart, breadcrumbs$ } = createMockCoreStart({
        currentAppId: 'dashboard',
        apps,
        breadcrumbs: [{ text: 'Dashboard' }],
      });

      service.start(coreStart, mockPluginsStart);

      // Default context should have been registered
      expect(mockAssistantContextStore.addContext).toHaveBeenCalledTimes(1);

      // Suppress
      (window as any).__defaultPageContextControl.suppress();

      expect(mockAssistantContextStore.removeContextById).toHaveBeenCalledWith(
        'default-page-context'
      );

      mockAssistantContextStore.addContext.mockClear();

      // Breadcrumbs update should not re-register while suppressed
      breadcrumbs$.next([{ text: 'Dashboard' }, { text: 'New Crumb' }]);

      expect(mockAssistantContextStore.addContext).not.toHaveBeenCalled();

      service.stop();
    });

    it('should unsuppress and re-register default context', () => {
      const apps = new Map([['dashboard', { title: 'Dashboard' }]]);
      const { coreStart } = createMockCoreStart({
        currentAppId: 'dashboard',
        apps,
        breadcrumbs: [{ text: 'Dashboard' }],
      });

      service.start(coreStart, mockPluginsStart);

      // Suppress then unsuppress
      (window as any).__defaultPageContextControl.suppress();
      mockAssistantContextStore.addContext.mockClear();

      (window as any).__defaultPageContextControl.unsuppress();

      expect(mockAssistantContextStore.addContext).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'default-page-context',
          value: {
            appId: 'dashboard',
            breadcrumbs: ['Dashboard'],
          },
        })
      );

      service.stop();
    });

    it('should clean up subscription on stop', () => {
      const apps = new Map([['dashboard', { title: 'Dashboard' }]]);
      const { coreStart, currentAppId$ } = createMockCoreStart({
        currentAppId: 'dashboard',
        apps,
      });

      service.start(coreStart, mockPluginsStart);

      service.stop();
      mockAssistantContextStore.addContext.mockClear();

      // Emitting after stop should not register context
      currentAppId$.next('visualize');

      expect(mockAssistantContextStore.addContext).not.toHaveBeenCalled();
    });

    it('should expose __defaultPageContextControl on window', () => {
      service.start(mockCoreStart, mockPluginsStart);

      const control = (window as any).__defaultPageContextControl;
      expect(control).toBeDefined();
      expect(typeof control.suppress).toBe('function');
      expect(typeof control.unsuppress).toBe('function');

      service.stop();
    });

    it('should remove __defaultPageContextControl on stop', () => {
      service.start(mockCoreStart, mockPluginsStart);
      expect((window as any).__defaultPageContextControl).toBeDefined();

      service.stop();
      expect((window as any).__defaultPageContextControl).toBeUndefined();
    });

    it('should use appId as label fallback when title is not found', () => {
      const { coreStart } = createMockCoreStart({
        currentAppId: 'unknown_app',
        apps: new Map(),
      });

      service.start(coreStart, mockPluginsStart);

      expect(mockAssistantContextStore.addContext).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Page: unknown_app',
          description: expect.stringContaining('Page context for'),
        })
      );

      service.stop();
    });
  });
});
