/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExplorePlugin } from './plugin';
import { coreMock } from '../../../core/public/mocks';
import { AskAIEmbeddableAction } from './actions/ask_ai_embeddable_action';
import { CONTEXT_MENU_TRIGGER } from '../../embeddable/public';
import { CoreSetup, CoreStart } from 'opensearch-dashboards/public';
import { ExplorePluginStart, ExploreSetupDependencies, ExploreStartDependencies } from './types';
import { DataPublicPluginSetup, DataPublicPluginStart } from '../../data/public';
import { UrlForwardingSetup, UrlForwardingStart } from '../../url_forwarding/public';
import { EmbeddableSetup, EmbeddableStart } from '../../embeddable/public';
import { VisualizationsSetup, VisualizationsStart } from '../../visualizations/public';
import { UiActionsSetup, UiActionsStart } from '../../ui_actions/public';
import { NavigationPublicPluginStart as NavigationStart } from '../../navigation/public';
import {
  OpenSearchDashboardsLegacySetup,
  OpenSearchDashboardsLegacyStart,
} from '../../opensearch_dashboards_legacy/public';
import { UsageCollectionSetup } from '../../usage_collection/public';
import { ExpressionsPublicPlugin, ExpressionsStart } from '../../expressions/public';
import { DashboardSetup, DashboardStart } from '../../dashboard/public';
import { ChartsPluginStart } from '../../charts/public';
import { Start as InspectorPublicPluginStart } from '../../inspector/public';
import { ChatPluginStart } from '../../chat/public';
import { ContextProviderStart } from '../../context_provider/public';

// Mock the action
jest.mock('./actions/ask_ai_embeddable_action');

// Mock log action registry
jest.mock('./services/log_action_registry', () => ({
  logActionRegistry: {
    registerAction: jest.fn(),
  },
}));

// Mock createAskAiAction
jest.mock('./actions/ask_ai_action', () => ({
  createAskAiAction: jest.fn().mockReturnValue({
    id: 'ask_ai',
    execute: jest.fn(),
  }),
}));

// Mock createOsdUrlTracker
jest.mock('../../opensearch_dashboards_utils/public', () => ({
  ...jest.requireActual('../../opensearch_dashboards_utils/public'),
  createOsdUrlTracker: jest.fn(() => ({
    appMounted: jest.fn(),
    appUnMounted: jest.fn(),
    stop: jest.fn(),
  })),
}));

describe('ExplorePlugin', () => {
  let plugin: ExplorePlugin;
  let initializerContext: ReturnType<typeof createMockInitializerContext>;
  let coreSetup: CoreSetup<ExploreStartDependencies, ExplorePluginStart>;
  let coreStart: CoreStart;
  let setupDeps: ExploreSetupDependencies;
  let startDeps: ExploreStartDependencies;

  function createMockInitializerContext() {
    return {
      config: {
        get: jest.fn().mockReturnValue({
          discoverTraces: {
            enabled: false,
          },
        }),
      },
      logger: {
        get: jest.fn().mockReturnValue({
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        }),
      },
      env: {
        packageInfo: {
          version: '1.0.0',
        },
      },
    };
  }

  function createMockSetupDeps(): ExploreSetupDependencies {
    return {
      data: ({
        __enhance: jest.fn(),
        query: {
          state$: {
            pipe: jest.fn().mockReturnValue({
              subscribe: jest.fn(),
            }),
          },
        },
      } as unknown) as DataPublicPluginSetup,
      urlForwarding: ({
        forwardApp: jest.fn(),
      } as Partial<UrlForwardingSetup>) as UrlForwardingSetup,
      embeddable: ({
        registerEmbeddableFactory: jest.fn(),
      } as Partial<EmbeddableSetup>) as EmbeddableSetup,
      visualizations: ({
        registerAlias: jest.fn(),
        all: jest.fn().mockReturnValue([]),
        getAliases: jest.fn().mockReturnValue([]),
      } as Partial<VisualizationsSetup>) as VisualizationsSetup,
      uiActions: ({
        getTriggerActions: jest.fn().mockReturnValue([]),
      } as Partial<UiActionsSetup>) as UiActionsSetup,
      navigation: {} as NavigationStart,
      opensearchDashboardsLegacy: {} as OpenSearchDashboardsLegacySetup,
      usageCollection: {} as UsageCollectionSetup,
      expressions: {} as ReturnType<ExpressionsPublicPlugin['setup']>,
      dashboard: {} as DashboardSetup,
    };
  }

  function createMockStartDeps(): ExploreStartDependencies {
    return {
      data: ({
        indexPatterns: {},
        dataViews: {},
        search: {},
        query: {
          filterManager: {},
          timefilter: {
            timefilter: {},
          },
          queryString: {
            clearQuery: jest.fn(),
          },
        },
      } as unknown) as DataPublicPluginStart,
      uiActions: ({
        registerAction: jest.fn(),
        addTriggerAction: jest.fn(),
        detachAction: jest.fn(),
        executeTriggerActions: jest.fn(),
        registerTrigger: jest.fn(),
        getTrigger: jest.fn(),
        getTriggers: jest.fn(),
        unregisterAction: jest.fn(),
        attachAction: jest.fn(),
        getAction: jest.fn(),
        hasAction: jest.fn(),
      } as Partial<UiActionsStart>) as UiActionsStart,
      dashboard: {} as DashboardStart,
      expressions: ({
        ExpressionLoader: jest.fn(),
      } as Partial<ExpressionsStart>) as ExpressionsStart,
      charts: ({
        theme: {},
      } as Partial<ChartsPluginStart>) as ChartsPluginStart,
      navigation: {} as NavigationStart,
      inspector: {} as InspectorPublicPluginStart,
      urlForwarding: {} as UrlForwardingStart,
      embeddable: {} as EmbeddableStart,
      opensearchDashboardsLegacy: {} as OpenSearchDashboardsLegacyStart,
      chat: ({
        chatService: {
          updateCurrentMessages: jest.fn(),
          sendMessageWithWindow: jest.fn(),
          openWindow: jest.fn(),
        },
      } as unknown) as ChatPluginStart,
      contextProvider: ({
        getAssistantContextStore: jest.fn().mockReturnValue({
          addContext: jest.fn(),
        }),
      } as Partial<ContextProviderStart>) as ContextProviderStart,
      visualizations: ({
        all: jest.fn().mockReturnValue([]),
        getAliases: jest.fn().mockReturnValue([]),
      } as Partial<VisualizationsStart>) as VisualizationsStart,
    };
  }

  beforeEach(() => {
    // Mock initializer context
    initializerContext = createMockInitializerContext();

    // Mock core setup
    coreSetup = coreMock.createSetup();
    coreSetup.getStartServices = jest.fn().mockResolvedValue([
      coreMock.createStart(),
      {
        data: {
          indexPatterns: {
            clearCache: jest.fn(),
          },
          query: {
            queryString: {
              clearQuery: jest.fn(),
            },
          },
        },
        uiActions: {
          getTriggerActions: jest.fn().mockReturnValue([]),
        },
        visualizations: {
          all: jest.fn().mockReturnValue([]),
          getAliases: jest.fn().mockReturnValue([]),
        },
      },
    ]);

    // Mock core start
    coreStart = coreMock.createStart();
    // Add workspaces mock with proper BehaviorSubject-like structure
    Object.defineProperty(coreStart, 'workspaces', {
      value: {
        currentWorkspace$: {
          pipe: jest.fn().mockReturnValue({
            toPromise: jest.fn().mockResolvedValue({
              features: ['observability'],
            }),
          }),
          subscribe: jest.fn(),
          getValue: jest.fn(),
          next: jest.fn(),
        },
      },
      writable: true,
      configurable: true,
    });

    // Mock setup dependencies
    setupDeps = createMockSetupDeps();

    // Mock start dependencies
    startDeps = createMockStartDeps();

    plugin = new ExplorePlugin(initializerContext as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setup', () => {
    it('should register explore applications', () => {
      plugin.setup(coreSetup as any, setupDeps as any);

      expect(coreSetup.application.register).toHaveBeenCalledTimes(4);
      expect(coreSetup.application.register).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'explore',
          title: 'Explore',
        })
      );
      expect(coreSetup.application.register).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'explore/logs',
          title: 'Logs',
        })
      );
      expect(coreSetup.application.register).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'explore/traces',
          title: 'Traces',
        })
      );
      expect(coreSetup.application.register).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'explore/metrics',
          title: 'Metrics',
        })
      );
    });

    it('should register embeddable factory', () => {
      plugin.setup(coreSetup, setupDeps);

      expect(setupDeps.embeddable.registerEmbeddableFactory).toHaveBeenCalledWith(
        'explore',
        expect.any(Object)
      );
    });

    it('should register visualization alias', () => {
      plugin.setup(coreSetup, setupDeps);

      expect(setupDeps.visualizations.registerAlias).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'DiscoverVisualization',
          aliasApp: 'explore',
          title: expect.any(String),
        })
      );
    });

    it('should setup URL forwarding', () => {
      plugin.setup(coreSetup, setupDeps);

      expect(setupDeps.urlForwarding.forwardApp).toHaveBeenCalledWith(
        'doc',
        'explore',
        expect.any(Function)
      );
      expect(setupDeps.urlForwarding.forwardApp).toHaveBeenCalledWith(
        'context',
        'explore',
        expect.any(Function)
      );
      expect(setupDeps.urlForwarding.forwardApp).toHaveBeenCalledWith(
        'discover',
        'explore',
        expect.any(Function)
      );
    });
  });

  describe('start', () => {
    beforeEach(() => {
      plugin.setup(coreSetup, setupDeps);
    });

    it('should register Ask AI embeddable action when chat and contextProvider are available', () => {
      plugin.start(coreStart, startDeps);

      expect(AskAIEmbeddableAction).toHaveBeenCalledWith(
        coreStart,
        startDeps.contextProvider,
        startDeps.chat
      );
      expect(startDeps.uiActions.registerAction).toHaveBeenCalled();
      expect(startDeps.uiActions.addTriggerAction).toHaveBeenCalledWith(
        CONTEXT_MENU_TRIGGER,
        expect.any(Object)
      );
    });

    it('should not register Ask AI embeddable action when chat is not available', () => {
      const startDepsWithoutChat = {
        ...startDeps,
        chat: undefined,
      };

      plugin.start(coreStart, startDepsWithoutChat);

      expect(AskAIEmbeddableAction).not.toHaveBeenCalled();
      expect(startDeps.uiActions.addTriggerAction).not.toHaveBeenCalledWith(
        CONTEXT_MENU_TRIGGER,
        expect.any(Object)
      );
    });

    it('should not register Ask AI embeddable action when contextProvider is not available', () => {
      const startDepsWithoutContextProvider = {
        ...startDeps,
        contextProvider: undefined,
      };

      plugin.start(coreStart, startDepsWithoutContextProvider);

      expect(AskAIEmbeddableAction).not.toHaveBeenCalled();
      expect(startDeps.uiActions.addTriggerAction).not.toHaveBeenCalledWith(
        CONTEXT_MENU_TRIGGER,
        expect.any(Object)
      );
    });

    it('should create saved explore loader', () => {
      const result = plugin.start(coreStart, startDeps);

      expect(result.savedExploreLoader).toBeDefined();
      expect(result.savedSearchLoader).toBeDefined();
      expect(result.savedSearchLoader).toBe(result.savedExploreLoader);
    });

    it('should return visualization and slot registries', () => {
      const result = plugin.start(coreStart, startDeps);

      expect(result.visualizationRegistry).toBeDefined();
      expect(result.slotRegistry).toBeDefined();
    });
  });

  describe('stop', () => {
    it('should call stop callbacks without errors', () => {
      plugin.setup(coreSetup, setupDeps);
      plugin.start(coreStart, startDeps);

      expect(() => plugin.stop()).not.toThrow();
    });
  });
});
