/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { buildServices } from './build_services';
import { TabRegistryService } from './services/tab_registry/tab_registry_service';
import { VisualizationRegistryService } from './services/visualization_registry_service';
import { QueryPanelActionsRegistryService } from './services/query_panel_actions_registry';
import { ExploreStartDependencies } from './types';

jest.mock('./saved_explore', () => ({
  createSavedExploreLoader: jest.fn().mockReturnValue({
    get: jest.fn(),
    urlFor: jest.fn(),
  }),
}));

jest.mock('./application/legacy/discover/opensearch_dashboards_services', () => ({
  getHistory: jest.fn(),
}));

const createMockPlugins = (): ExploreStartDependencies =>
  (({
    data: {
      indexPatterns: {},
      search: {},
      query: {
        filterManager: {},
        timefilter: { timefilter: {} },
      },
      dataViews: {},
    },
    charts: { theme: {} },
    inspector: {},
    navigation: {},
    share: {},
    contextProvider: {},
    opensearchDashboardsLegacy: {},
    urlForwarding: {},
    visualizations: {},
    uiActions: {},
    embeddable: {},
    expressions: {},
    dashboard: {},
  } as unknown) as ExploreStartDependencies);

const createMockInitializerContext = (sqlSupportEnabled: boolean) => ({
  config: {
    get: jest.fn().mockReturnValue({
      enabled: true,
      supportedTypes: ['INDEX_PATTERN'],
      sqlSupport: { enabled: sqlSupportEnabled },
      discoverTraces: { enabled: false },
      discoverMetrics: { enabled: false },
      agentTraces: { enabled: false },
    }),
    create: jest.fn(),
    createIfExists: jest.fn(),
  },
  env: {
    mode: { dev: false, name: 'production', prod: true },
    packageInfo: {
      branch: 'main',
      version: '1.0.0',
      buildNum: 1,
      buildSha: 'abc',
      dist: false,
    },
    instanceUuid: 'test-uuid',
  },
  logger: {
    get: jest.fn(),
  },
  opaqueId: Symbol('test'),
});

describe('buildServices', () => {
  let tabRegistry: TabRegistryService;
  let visualizationRegistry: VisualizationRegistryService;
  let queryPanelActionsRegistry: QueryPanelActionsRegistryService;

  beforeEach(() => {
    tabRegistry = new TabRegistryService();
    visualizationRegistry = new VisualizationRegistryService();
    queryPanelActionsRegistry = new QueryPanelActionsRegistryService();
  });

  describe('SQL feature flag', () => {
    it('exposes sqlSupportEnabled as true when config has sqlSupport.enabled set to true', () => {
      const services = buildServices(
        coreMock.createStart(),
        createMockPlugins(),
        createMockInitializerContext(true) as any,
        tabRegistry,
        visualizationRegistry,
        queryPanelActionsRegistry
      );

      expect(services.sqlSupportEnabled).toBe(true);
    });

    it('exposes sqlSupportEnabled as false when config has sqlSupport.enabled set to false', () => {
      const services = buildServices(
        coreMock.createStart(),
        createMockPlugins(),
        createMockInitializerContext(false) as any,
        tabRegistry,
        visualizationRegistry,
        queryPanelActionsRegistry
      );

      expect(services.sqlSupportEnabled).toBe(false);
    });

    it('reads sqlSupport from the plugin config via context.config.get', () => {
      const context = createMockInitializerContext(true);

      buildServices(
        coreMock.createStart(),
        createMockPlugins(),
        context as any,
        tabRegistry,
        visualizationRegistry,
        queryPanelActionsRegistry
      );

      expect(context.config.get).toHaveBeenCalledTimes(1);
    });
  });
});
