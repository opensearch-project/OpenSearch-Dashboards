/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppNavLinkStatus, NavGroupType, PublicAppInfo } from '../../../core/public';
import {
  featureMatchesConfig,
  filterWorkspaceConfigurableApps,
  isAppAccessibleInWorkspace,
  isFeatureIdInsideUseCase,
  isNavGroupInFeatureConfigs,
  getDataSourcesList,
  convertNavGroupToWorkspaceUseCase,
  isEqualWorkspaceUseCase,
  USE_CASE_PREFIX,
  prependWorkspaceToBreadcrumbs,
  getIsOnlyAllowEssentialUseCase,
} from './utils';
import { WorkspaceAvailability } from '../../../core/public';
import { coreMock } from '../../../core/public/mocks';
import { WORKSPACE_DETAIL_APP_ID } from '../common/constants';
import { SigV4ServiceName } from '../../../plugins/data_source/common/data_sources';
import { createMockedRegisteredUseCases } from './mocks';

const startMock = coreMock.createStart();
const STATIC_USE_CASES = createMockedRegisteredUseCases();
const useCaseMock = {
  id: 'foo',
  title: 'Foo',
  description: 'Foo description',
  features: [{ id: 'bar' }],
  systematic: false,
  order: 1,
};

describe('workspace utils: featureMatchesConfig', () => {
  it('feature configured with `*` should match any features', () => {
    const match = featureMatchesConfig(['*'], STATIC_USE_CASES);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      true
    );
    expect(
      match({ id: 'discover', category: { id: 'opensearchDashboards', label: 'Library' } })
    ).toBe(true);
  });

  it('should NOT match the config if feature id not matches', () => {
    const match = featureMatchesConfig(['discover', 'dashboards', 'visualize'], STATIC_USE_CASES);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      false
    );
  });

  it('should match the config if feature id matches', () => {
    const match = featureMatchesConfig(['discover', 'dashboards', 'visualize'], STATIC_USE_CASES);
    expect(
      match({ id: 'discover', category: { id: 'opensearchDashboards', label: 'Library' } })
    ).toBe(true);
  });

  it('should match the config if feature category matches', () => {
    const match = featureMatchesConfig(
      ['discover', 'dashboards', '@management', 'visualize'],
      STATIC_USE_CASES
    );
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      true
    );
  });

  it('should match any features but not the excluded feature id', () => {
    const match = featureMatchesConfig(['*', '!discover'], STATIC_USE_CASES);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      true
    );
    expect(
      match({ id: 'discover', category: { id: 'opensearchDashboards', label: 'Library' } })
    ).toBe(false);
  });

  it('should match any features but not the excluded feature category', () => {
    const match = featureMatchesConfig(['*', '!@management'], STATIC_USE_CASES);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      false
    );
    expect(match({ id: 'integrations', category: { id: 'management', label: 'Management' } })).toBe(
      false
    );
    expect(
      match({ id: 'discover', category: { id: 'opensearchDashboards', label: 'Library' } })
    ).toBe(true);
  });

  it('should NOT match the excluded feature category', () => {
    const match = featureMatchesConfig(['!@management'], STATIC_USE_CASES);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      false
    );
    expect(match({ id: 'integrations', category: { id: 'management', label: 'Management' } })).toBe(
      false
    );
  });

  it('should match features of a category but NOT the excluded feature', () => {
    const match = featureMatchesConfig(['@management', '!dev_tools'], STATIC_USE_CASES);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      false
    );
    expect(match({ id: 'integrations', category: { id: 'management', label: 'Management' } })).toBe(
      true
    );
  });

  it('a config presents later in the config array should override the previous config', () => {
    // though `dev_tools` is excluded, but this config will override by '@management' as dev_tools has category 'management'
    const match = featureMatchesConfig(['!dev_tools', '@management'], STATIC_USE_CASES);
    expect(match({ id: 'dev_tools', category: { id: 'management', label: 'Management' } })).toBe(
      true
    );
    expect(match({ id: 'integrations', category: { id: 'management', label: 'Management' } })).toBe(
      true
    );
  });

  it('should match features include by any use cases', () => {
    const match = featureMatchesConfig(
      ['use-case-observability', 'use-case-search'],
      STATIC_USE_CASES
    );
    expect(match({ id: 'dashboards' })).toBe(true);
    expect(match({ id: 'observability-traces' })).toBe(true);

    /**
     * The searchRelevance is a feature under search use case. Since each workspace only can be a specific use case,
     * the feature matches will use first use case to check if features exists. The observability doesn't have
     * searchRelevance feature, it will return false.
     */
    expect(match({ id: 'searchRelevance' })).toBe(false);
    expect(match({ id: 'not-in-any-use-case' })).toBe(false);
  });
});

describe('workspace utils: isAppAccessibleInWorkspace', () => {
  it('any app is accessible when workspace has no features configured', () => {
    expect(
      isAppAccessibleInWorkspace(
        { id: 'any_app', title: 'Any app', mount: jest.fn() },
        { id: 'workspace_id', name: 'workspace name' },
        STATIC_USE_CASES
      )
    ).toBe(true);
  });

  it('An app is accessible when the workspace has the app configured', () => {
    expect(
      isAppAccessibleInWorkspace(
        { id: 'dev_tools', title: 'Any app', mount: jest.fn() },
        { id: 'workspace_id', name: 'workspace name', features: ['dev_tools'] },
        STATIC_USE_CASES
      )
    ).toBe(true);
  });

  it('An app is not accessible when the workspace does not have the app configured', () => {
    expect(
      isAppAccessibleInWorkspace(
        { id: 'dev_tools', title: 'Any app', mount: jest.fn() },
        { id: 'workspace_id', name: 'workspace name', features: [] },
        STATIC_USE_CASES
      )
    ).toBe(false);
  });

  it('An app is accessible if the nav link is hidden', () => {
    expect(
      isAppAccessibleInWorkspace(
        {
          id: 'dev_tools',
          title: 'Any app',
          mount: jest.fn(),
          navLinkStatus: AppNavLinkStatus.hidden,
        },
        { id: 'workspace_id', name: 'workspace name', features: [] },
        STATIC_USE_CASES
      )
    ).toBe(true);
  });

  it('An app is accessible if it is chromeless', () => {
    expect(
      isAppAccessibleInWorkspace(
        {
          id: 'dev_tools',
          title: 'Any app',
          mount: jest.fn(),
          chromeless: true,
        },
        { id: 'workspace_id', name: 'workspace name', features: [] },
        STATIC_USE_CASES
      )
    ).toBe(true);
  });

  it('An app is not accessible within a workspace if its workspaceAvailability is outsideWorkspace', () => {
    expect(
      isAppAccessibleInWorkspace(
        {
          id: 'home',
          title: 'Any app',
          mount: jest.fn(),
          workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
        },
        { id: 'workspace_id', name: 'workspace name', features: [] },
        STATIC_USE_CASES
      )
    ).toBe(false);
  });
  it('An app is accessible within a workspace if its workspaceAvailability is insideWorkspace', () => {
    expect(
      isAppAccessibleInWorkspace(
        {
          id: 'home',
          title: 'Any app',
          mount: jest.fn(),
          workspaceAvailability: WorkspaceAvailability.insideWorkspace,
        },
        { id: 'workspace_id', name: 'workspace name', features: ['home'] },
        STATIC_USE_CASES
      )
    ).toBe(true);
  });
  it('An app is accessible within a workspace if its workspaceAvailability is inside and outsideWorkspace', () => {
    expect(
      isAppAccessibleInWorkspace(
        {
          id: 'home',
          title: 'Any app',
          mount: jest.fn(),
          workspaceAvailability:
            // eslint-disable-next-line no-bitwise
            WorkspaceAvailability.insideWorkspace | WorkspaceAvailability.outsideWorkspace,
        },
        { id: 'workspace_id', name: 'workspace name', features: ['home'] },
        STATIC_USE_CASES
      )
    ).toBe(true);
  });
  it('any app is accessible when workspace is all use case', () => {
    expect(
      isAppAccessibleInWorkspace(
        { id: 'any_app', title: 'Any app', mount: jest.fn() },
        { id: 'workspace_id', name: 'workspace name', features: ['use-case-all'] },
        STATIC_USE_CASES
      )
    ).toBe(true);
  });
});

describe('workspace utils: filterWorkspaceConfigurableApps', () => {
  const defaultApplications = [
    {
      appRoute: '/app/dashboards',
      id: 'dashboards',
      title: 'Dashboards',
      category: {
        id: 'opensearchDashboards',
        label: 'OpenSearch Dashboards',
        euiIconType: 'inputOutput',
        order: 1000,
      },
      status: 0,
      navLinkStatus: 1,
    },
    {
      appRoute: '/app/dev_tools',
      id: 'dev_tools',
      title: 'Dev Tools',
      category: {
        id: 'management',
        label: 'Management',
        order: 5000,
        euiIconType: 'managementApp',
      },
      status: 0,
      navLinkStatus: 1,
    },
    {
      appRoute: '/app/opensearch_dashboards_overview',
      id: 'opensearchDashboardsOverview',
      title: 'Overview',
      category: {
        id: 'opensearchDashboards',
        label: 'Library',
        euiIconType: 'inputOutput',
        order: 1000,
      },
      navLinkStatus: 1,
      order: -2000,
      status: 0,
      workspaceAvailability: WorkspaceAvailability.outsideWorkspace,
    },
    {
      appRoute: '/app/management',
      id: 'management',
      title: 'Dashboards Management',
      category: {
        id: 'management',
        label: 'Management',
        order: 5000,
        euiIconType: 'managementApp',
      },
      status: 0,
      navLinkStatus: 1,
    },
  ] as PublicAppInfo[];
  it('should filters out apps that are not accessible in the workspace', () => {
    const filteredApps = filterWorkspaceConfigurableApps(defaultApplications);
    expect(filteredApps.length).toEqual(2);
    expect(filteredApps[0].id).toEqual('dashboards');
    expect(filteredApps[1].id).toEqual('management');
  });
});

describe('workspace utils: isFeatureIdInsideUseCase', () => {
  it('should return false for invalid use case', () => {
    expect(isFeatureIdInsideUseCase('discover', 'invalid', [])).toBe(false);
  });
  it('should return false if feature not in use case', () => {
    expect(
      isFeatureIdInsideUseCase('discover', 'foo', [
        {
          id: 'foo',
          title: 'Foo',
          description: 'Foo description',
          features: [],
        },
      ])
    ).toBe(false);
  });
  it('should return true if feature id exists in use case', () => {
    expect(
      isFeatureIdInsideUseCase('discover', 'foo', [
        {
          id: 'foo',
          title: 'Foo',
          description: 'Foo description',
          features: [{ id: 'discover' }],
        },
      ])
    ).toBe(true);
  });
});

describe('workspace utils: isNavGroupInFeatureConfigs', () => {
  it('should return false if nav group not in feature configs', () => {
    expect(
      isNavGroupInFeatureConfigs('dataAdministration', [
        'use-case-observability',
        'use-case-search',
      ])
    ).toBe(false);
  });
  it('should return true if nav group in feature configs', () => {
    expect(
      isNavGroupInFeatureConfigs('observability', ['use-case-observability', 'use-case-search'])
    ).toBe(true);
  });
});

describe('workspace utils: getDataSourcesList', () => {
  const mockedSavedObjectClient = startMock.savedObjects.client;

  it('should return result when passed saved object client', async () => {
    mockedSavedObjectClient.find = jest.fn().mockResolvedValue({
      savedObjects: [
        {
          id: 'id1',
          get: (param: string) => {
            switch (param) {
              case 'title':
                return 'title1';
              case 'description':
                return 'description1';
              case 'dataSourceEngineType':
                return 'dataSourceEngineType1';
              case 'auth':
                return 'mock_value';
            }
          },
        },
      ],
    });
    expect(await getDataSourcesList(mockedSavedObjectClient, [])).toStrictEqual([
      {
        id: 'id1',
        title: 'title1',
        auth: 'mock_value',
        description: 'description1',
        dataSourceEngineType: 'dataSourceEngineType1',
        workspaces: [],
      },
    ]);
  });

  it('should return empty array if no saved objects responded', async () => {
    mockedSavedObjectClient.find = jest.fn().mockResolvedValue({});
    expect(await getDataSourcesList(mockedSavedObjectClient, [])).toStrictEqual([]);
  });
});

describe('workspace utils: getIsOnlyAllowEssentialUseCase', () => {
  const mockedSavedObjectClient = startMock.savedObjects.client;

  it('should return true when all data sources are serverless', async () => {
    mockedSavedObjectClient.find = jest.fn().mockResolvedValue({
      savedObjects: [
        {
          id: 'id1',
          get: () => {
            return {
              credentials: {
                service: SigV4ServiceName.OpenSearchServerless,
              },
            };
          },
        },
      ],
    });
    expect(await getIsOnlyAllowEssentialUseCase(mockedSavedObjectClient)).toBe(true);
  });

  it('should return false when not all data sources are serverless', async () => {
    mockedSavedObjectClient.find = jest.fn().mockResolvedValue({
      savedObjects: [
        {
          id: 'id1',
          get: () => {
            return {
              credentials: {
                service: SigV4ServiceName.OpenSearchServerless,
              },
            };
          },
        },
        {
          id: 'id2',
          get: () => {
            return {
              credentials: {
                service: SigV4ServiceName.OpenSearch,
              },
            };
          },
        },
      ],
    });
    expect(await getIsOnlyAllowEssentialUseCase(mockedSavedObjectClient)).toBe(false);
  });
});

describe('workspace utils: convertNavGroupToWorkspaceUseCase', () => {
  it('should convert nav group to consistent workspace use case', () => {
    expect(
      convertNavGroupToWorkspaceUseCase({
        id: 'foo',
        title: 'Foo',
        description: 'Foo description',
        navLinks: [{ id: 'bar', title: 'Bar' }],
      })
    ).toEqual({
      id: 'foo',
      title: 'Foo',
      description: 'Foo description',
      features: [{ id: 'bar', title: 'Bar' }],
      systematic: false,
    });

    expect(
      convertNavGroupToWorkspaceUseCase({
        id: 'foo',
        title: 'Foo',
        description: 'Foo description',
        navLinks: [{ id: 'bar', title: 'Bar' }],
        type: NavGroupType.SYSTEM,
      })
    ).toEqual({
      id: 'foo',
      title: 'Foo',
      description: 'Foo description',
      features: [{ id: 'bar', title: 'Bar' }],
      systematic: true,
    });
  });
});

describe('workspace utils: isEqualWorkspaceUseCase', () => {
  it('should return false when id not equal', () => {
    expect(
      isEqualWorkspaceUseCase(useCaseMock, {
        ...useCaseMock,
        id: 'foo1',
      })
    ).toEqual(false);
  });
  it('should return false when title not equal', () => {
    expect(
      isEqualWorkspaceUseCase(useCaseMock, {
        ...useCaseMock,
        title: 'Foo1',
      })
    ).toEqual(false);
  });
  it('should return false when description not equal', () => {
    expect(
      isEqualWorkspaceUseCase(useCaseMock, {
        ...useCaseMock,
        description: 'Foo description 1',
      })
    ).toEqual(false);
  });
  it('should return false when systematic not equal', () => {
    expect(
      isEqualWorkspaceUseCase(useCaseMock, {
        ...useCaseMock,
        systematic: true,
      })
    ).toEqual(false);
  });
  it('should return false when order not equal', () => {
    expect(
      isEqualWorkspaceUseCase(useCaseMock, {
        ...useCaseMock,
        order: 2,
      })
    ).toEqual(false);
  });
  it('should return false when features length not equal', () => {
    expect(
      isEqualWorkspaceUseCase(useCaseMock, {
        ...useCaseMock,
        features: [],
      })
    ).toEqual(false);
  });
  it('should return false when features id not equal', () => {
    expect(
      isEqualWorkspaceUseCase(useCaseMock, {
        ...useCaseMock,
        features: [{ id: 'baz' }],
      })
    ).toEqual(false);
  });
  it('should return false when features title not equal', () => {
    expect(
      isEqualWorkspaceUseCase(useCaseMock, {
        ...useCaseMock,
        features: [{ id: 'bar', title: 'Baz' }],
      })
    ).toEqual(false);
  });
  it('should return false for duplicate features', () => {
    expect(
      isEqualWorkspaceUseCase(
        { ...useCaseMock, features: [useCaseMock.features[0], useCaseMock.features[0]] },
        {
          ...useCaseMock,
          features: [
            useCaseMock.features[0],
            {
              id: 'another',
              title: 'Another',
            },
          ],
        }
      )
    ).toEqual(false);
  });
  it('should return true for multi same features', () => {
    const anotherFeature = {
      id: 'another',
      title: 'Another',
    };
    expect(
      isEqualWorkspaceUseCase(
        { ...useCaseMock, features: [useCaseMock.features[0], anotherFeature] },
        {
          ...useCaseMock,
          features: [useCaseMock.features[0], anotherFeature],
        }
      )
    ).toEqual(true);
  });
  it('should return true when all properties equal', () => {
    expect(
      isEqualWorkspaceUseCase(useCaseMock, {
        ...useCaseMock,
      })
    ).toEqual(true);
  });
});

describe('workspace utils: prependWorkspaceToBreadcrumbs', () => {
  const workspace = {
    id: 'workspace-1',
    name: 'test workspace 1',
    features: [`${USE_CASE_PREFIX}search`],
  };

  it('should not enrich breadcrumbs for workspace detail page', () => {
    const coreStart = coreMock.createStart();
    prependWorkspaceToBreadcrumbs(coreStart, workspace, WORKSPACE_DETAIL_APP_ID, undefined, {});
    expect(coreStart.chrome.setBreadcrumbsEnricher).toHaveBeenCalledWith(undefined);
  });

  it('should not enrich breadcrumbs when out a workspace', async () => {
    const coreStart = coreMock.createStart();
    prependWorkspaceToBreadcrumbs(coreStart, null, 'app1', undefined, {});
    expect(coreStart.chrome.setBreadcrumbsEnricher).not.toHaveBeenCalled();
  });

  it('should enrich breadcrumbs when in a workspace and use workspace use case as current nav group', async () => {
    const navGroupSearch = {
      id: 'search',
      title: 'Search',
      description: 'search desc',
      navLinks: [],
    };
    const navGroupDashboards = {
      id: 'ds',
      title: 'Dashboards',
      description: 'Dashboards desc',
      navLinks: [],
    };

    const coreStart = coreMock.createStart();
    prependWorkspaceToBreadcrumbs(coreStart, workspace, 'app1', undefined, {
      search: navGroupSearch,
      ds: navGroupDashboards,
    });
    expect(coreStart.chrome.setBreadcrumbsEnricher).toHaveBeenCalledTimes(1);
    let calls = coreStart.chrome.setBreadcrumbsEnricher.mock.calls;
    // calls is an array of arrays, where each inner array represents the arguments for a single call
    // get the actual enricher
    let enricher = calls[0][0];

    const breadcrumbs = [{ text: 'test app' }];
    let enrichedBreadcrumbs = enricher?.(breadcrumbs);
    expect(enrichedBreadcrumbs).toHaveLength(3);
    expect(enrichedBreadcrumbs?.[1].text).toEqual('Search');

    // ignore current nav group
    prependWorkspaceToBreadcrumbs(coreStart, workspace, 'app1', navGroupDashboards, {
      search: navGroupSearch,
      ds: navGroupDashboards,
    });
    expect(coreStart.chrome.setBreadcrumbsEnricher).toHaveBeenCalledTimes(2);
    calls = coreStart.chrome.setBreadcrumbsEnricher.mock.calls;
    // calls is an array of arrays, where each inner array represents the arguments for a single call
    // get the actual enricher
    enricher = calls[0][0];

    enrichedBreadcrumbs = enricher?.(breadcrumbs);
    expect(enrichedBreadcrumbs).toHaveLength(3);
    expect(enrichedBreadcrumbs?.[1].text).toEqual('Search');
  });

  it('should enrich breadcrumbs when in a workspace with all use case and use selected nav group', async () => {
    const workspaceWithAllUseCase = {
      id: 'workspace-all',
      name: 'test workspace 1',
      features: [`${USE_CASE_PREFIX}all`],
    };

    const navGroupSearch = {
      id: 'search',
      title: 'Search',
      description: 'search desc',
      navLinks: [],
    };
    const navGroupDashboards = {
      id: 'ds',
      title: 'Dashboards',
      description: 'Dashboards desc',
      navLinks: [],
    };

    const coreStart = coreMock.createStart();
    prependWorkspaceToBreadcrumbs(coreStart, workspaceWithAllUseCase, 'app1', navGroupDashboards, {
      search: navGroupSearch,
      ds: navGroupDashboards,
    });
    expect(coreStart.chrome.setBreadcrumbsEnricher).toHaveBeenCalledTimes(1);

    const calls = coreStart.chrome.setBreadcrumbsEnricher.mock.calls;
    // calls is an array of arrays, where each inner array represents the arguments for a single call
    // get the actual enricher
    const enricher = calls[0][0];

    const breadcrumbs = [{ text: 'test app' }];
    const enrichedBreadcrumbs = enricher?.(breadcrumbs);
    expect(enrichedBreadcrumbs).toHaveLength(4);
    expect(enrichedBreadcrumbs?.[1].text).toEqual(workspaceWithAllUseCase.name);
    expect(enrichedBreadcrumbs?.[2].text).toEqual(navGroupDashboards.title);
  });

  it('should enrich breadcrumbs when in a workspace with all use case and current nav group is null', async () => {
    const workspaceWithAllUseCase = {
      id: 'workspace-all',
      name: 'test workspace 1',
      features: [`${USE_CASE_PREFIX}all`],
    };

    const navGroupSearch = {
      id: 'search',
      title: 'Search',
      description: 'search desc',
      navLinks: [],
    };
    const navGroupDashboards = {
      id: 'ds',
      title: 'Dashboards',
      description: 'Dashboards desc',
      navLinks: [],
    };

    const coreStart = coreMock.createStart();
    prependWorkspaceToBreadcrumbs(coreStart, workspaceWithAllUseCase, 'app1', undefined, {
      search: navGroupSearch,
      ds: navGroupDashboards,
    });
    expect(coreStart.chrome.setBreadcrumbsEnricher).toHaveBeenCalledTimes(1);

    const calls = coreStart.chrome.setBreadcrumbsEnricher.mock.calls;
    // calls is an array of arrays, where each inner array represents the arguments for a single call
    // get the actual enricher
    const enricher = calls[0][0];

    const enrichedBreadcrumbs = enricher?.([{ text: 'overview' }]);
    expect(enrichedBreadcrumbs).toHaveLength(3);
    expect(enrichedBreadcrumbs?.[1].text).toEqual(workspaceWithAllUseCase.name);
  });
});
