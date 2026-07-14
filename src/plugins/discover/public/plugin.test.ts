/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../core/public/mocks';
import { DEFAULT_NAV_GROUPS } from '../../../core/public';
import { DiscoverPlugin } from './plugin';
import { dataPluginMock } from '../../data/public/mocks';
import { embeddablePluginMock } from '../../embeddable/public/mocks';
import { opensearchDashboardsLegacyPluginMock } from '../../opensearch_dashboards_legacy/public/mocks';
import { urlForwardingPluginMock } from '../../url_forwarding/public/mocks';
import { uiActionsPluginMock } from '../../ui_actions/public/mocks';
import { visualizationsPluginMock } from '../../visualizations/public/mocks';
import { setServices } from './opensearch_dashboards_services';

const getSetupDeps = (overrides?: { explore?: {} }) => ({
  data: dataPluginMock.createSetupContract(),
  embeddable: embeddablePluginMock.createSetupContract(),
  opensearchDashboardsLegacy: opensearchDashboardsLegacyPluginMock.createSetupContract(),
  urlForwarding: urlForwardingPluginMock.createSetupContract(),
  uiActions: uiActionsPluginMock.createSetupContract(),
  visualizations: visualizationsPluginMock.createSetupContract(),
  dataExplorer: {
    registerView: jest.fn(),
  },
  ...overrides,
});

describe('DiscoverPlugin', () => {
  afterEach(() => {
    setServices(null);
  });

  it('setup successfully', () => {
    const setupMock = coreMock.createSetup();
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new DiscoverPlugin(initializerContext);
    expect(() =>
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      pluginInstance.setup(setupMock, getSetupDeps())
    ).not.toThrow();
    expect(setupMock.chrome.navGroup.addNavLinksToGroup).toBeCalledTimes(5);
  });

  it('should not register discover in observability when icon side nav is enabled', () => {
    const setupMock = coreMock.createSetup();
    setupMock.chrome.getIsIconSideNavEnabled.mockReturnValue(true);
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new DiscoverPlugin(initializerContext);
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    pluginInstance.setup(setupMock, getSetupDeps());

    const observabilityCall = setupMock.chrome.navGroup.addNavLinksToGroup.mock.calls.find(
      (call) => call[0] === DEFAULT_NAV_GROUPS.observability
    );
    expect(observabilityCall).toBeUndefined();
  });

  it('should register discover in observability when icon side nav is disabled and explore is not present', () => {
    const setupMock = coreMock.createSetup();
    setupMock.chrome.getIsIconSideNavEnabled.mockReturnValue(false);
    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new DiscoverPlugin(initializerContext);
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    pluginInstance.setup(setupMock, getSetupDeps());

    const observabilityCall = setupMock.chrome.navGroup.addNavLinksToGroup.mock.calls.find(
      (call) => call[0] === DEFAULT_NAV_GROUPS.observability
    );
    expect(observabilityCall).toBeDefined();
    expect(observabilityCall![1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'discover',
          order: 300,
        }),
      ])
    );
  });

  it('registers document view links against the Discover app route', () => {
    const setupMock = coreMock.createSetup();
    setupMock.http.basePath.prepend = jest.fn((path: string) => `/w/workspace-id${path}`);
    setServices({
      filterManager: {
        getGlobalFilters: jest.fn(() => []),
        getAppFilters: jest.fn(() => []),
      },
      data: {
        query: {
          queryString: {
            getQuery: jest.fn(() => ({ language: 'kuery', query: '' })),
            getLanguageService: jest.fn(() => ({
              getLanguage: jest.fn(() => ({})),
            })),
          },
        },
      },
    });

    const initializerContext = coreMock.createPluginInitializerContext();
    const pluginInstance = new DiscoverPlugin(initializerContext);
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    pluginInstance.setup(setupMock, getSetupDeps());

    window.history.pushState({}, '', '/w/workspace-id/app/data-explorer/discover#/');
    const [surroundingDocumentsLink, singleDocumentLink] = (
      pluginInstance as any
    ).docViewsLinksRegistry.getDocViewsLinksSorted();
    const renderProps = {
      columns: ['@timestamp'],
      hit: { _id: 'doc-id', _index: 'index-name' },
      indexPattern: {
        id: 'index-pattern-id',
        isTimeBased: jest.fn(() => true),
      },
    };

    expect(surroundingDocumentsLink.generateCb(renderProps).url).toBe(
      "/w/workspace-id/app/discover#/context/index-pattern-id/doc-id?_g=(filters:!())&_a=(columns:!('@timestamp'),filters:!())"
    );
    expect(singleDocumentLink.generateCb(renderProps).url).toBe(
      '/w/workspace-id/app/discover#/doc/index-pattern-id/index-name?id=doc-id'
    );

    window.history.pushState({}, '', '/w/workspace-id/app/dashboards#/view/dashboard-id');
    expect(surroundingDocumentsLink.generateCb(renderProps).url).toContain(
      '/w/workspace-id/app/discover#/context/index-pattern-id/doc-id'
    );
  });
});
