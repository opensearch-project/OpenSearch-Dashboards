/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentTracesPlugin } from './plugin';
import { coreMock } from '../../../core/public/mocks';
import { CoreSetup, CoreStart } from 'opensearch-dashboards/public';
import {
  AgentTracesPluginStart,
  AgentTracesSetupDependencies,
  AgentTracesStartDependencies,
} from './types';
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
import { ContextProviderStart } from '../../context_provider/public';

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

describe('AgentTracesPlugin', () => {
  let plugin: AgentTracesPlugin;
  let initializerContext: ReturnType<typeof createMockInitializerContext>;
  let coreSetup: CoreSetup<AgentTracesStartDependencies, AgentTracesPluginStart>;
  let coreStart: CoreStart;
  let setupDeps: AgentTracesSetupDependencies;
  let startDeps: AgentTracesStartDependencies;

  function createMockInitializerContext() {
    return {
      config: {
        get: jest.fn().mockReturnValue({}),
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

  function createMockSetupDeps(): AgentTracesSetupDependencies {
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

  function createMockStartDeps(): AgentTracesStartDependencies {
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

    plugin = new AgentTracesPlugin(initializerContext as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setup', () => {
    it('should register agent traces applications', () => {
      plugin.setup(coreSetup as any, setupDeps as any);

      expect(coreSetup.application.register).toHaveBeenCalledTimes(1);
      expect(coreSetup.application.register).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'agentTraces',
        })
      );
    });

    it('should register embeddable factory', () => {
      plugin.setup(coreSetup, setupDeps);

      expect(setupDeps.embeddable.registerEmbeddableFactory).toHaveBeenCalledWith(
        'agentTraces',
        expect.any(Object)
      );
    });

    it('should not register visualization alias', () => {
      plugin.setup(coreSetup, setupDeps);

      expect(setupDeps.visualizations.registerAlias).not.toHaveBeenCalled();
    });

    it('should register the main app with updater observable', () => {
      plugin.setup(coreSetup, setupDeps);

      expect(coreSetup.application.register).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'agentTraces',
        })
      );
    });

    it('should register nav links during setup', () => {
      plugin.setup(coreSetup, setupDeps);

      expect(coreSetup.chrome.navGroup.addNavLinksToGroup).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining([expect.objectContaining({ id: 'agentTraces' })])
      );
    });
  });

  describe('start', () => {
    beforeEach(() => {
      plugin.setup(coreSetup, setupDeps);
    });

    it('should create saved agent traces loader', () => {
      const result = plugin.start(coreStart, startDeps);

      expect(result.savedAgentTracesLoader).toBeDefined();
      expect(result.savedSearchLoader).toBeDefined();
      expect(result.savedSearchLoader).toBe(result.savedAgentTracesLoader);
    });

    it('should return slot registry', () => {
      const result = plugin.start(coreStart, startDeps);

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
