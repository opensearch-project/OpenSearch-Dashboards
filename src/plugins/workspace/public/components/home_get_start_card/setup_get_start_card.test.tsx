/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ContentManagementPluginStart } from '../../../../../plugins/content_management/public';
import { coreMock } from '../../../../../core/public/mocks';
import { registerGetStartedCardToNewHome } from './setup_get_start_card';
import { createMockedRegisteredUseCases$ } from '../../mocks';
import { WorkspaceObject } from 'opensearch-dashboards/public';

describe('Setup use get start card at new home page', () => {
  const navigateToApp = jest.fn();

  const getMockCore = (workspaceList: WorkspaceObject[], isDashboardAdmin: boolean) => {
    const coreStartMock = coreMock.createStart();
    coreStartMock.application.capabilities = {
      ...coreStartMock.application.capabilities,
      dashboards: { isDashboardAdmin },
    };
    coreStartMock.workspaces.workspaceList$.next(workspaceList);
    coreStartMock.application = {
      ...coreStartMock.application,
      navigateToApp,
    };
    jest.spyOn(coreStartMock.application, 'getUrlForApp').mockImplementation((appId: string) => {
      return `https://test.com/app/${appId}`;
    });
    return coreStartMock;
  };
  const registerContentProviderMock = jest.fn();
  const registeredUseCases$ = createMockedRegisteredUseCases$();
  const useCasesMock = [
    {
      id: 'dataAdministration',
      title: 'Data administration',
      description: 'Apply policies or security on your data.',
      features: [
        {
          id: 'data_administration_landing',
          title: 'Overview',
        },
      ],
      systematic: true,
      order: 1000,
    },
    {
      id: 'essentials',
      title: 'Essentials',
      description:
        'Analyze data to derive insights, identify patterns and trends, and make data-driven decisions.',
      features: [
        {
          id: 'essentials_overview',
          title: 'Overview',
        },
        {
          id: 'discover',
          title: 'Discover',
        },
      ],
      systematic: false,
      order: 7000,
    },
  ];
  registeredUseCases$.next(useCasesMock);

  const contentManagementStartMock: ContentManagementPluginStart = {
    registerContentProvider: registerContentProviderMock,
    renderPage: jest.fn(),
    updatePageSection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a tooltip message when there are no workspaces and the user is not dashboard admin', () => {
    const core = getMockCore([], false);
    registerGetStartedCardToNewHome(core, contentManagementStartMock, registeredUseCases$);

    const calls = registerContentProviderMock.mock.calls;
    expect(calls.length).toBe(1);

    const firstCall = calls[0];
    expect(firstCall[0].getTargetArea()).toMatchInlineSnapshot(`
      Array [
        "osd_homepage/get_started",
      ]
    `);
    expect(firstCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "cardProps": Object {
          "layout": "horizontal",
        },
        "description": "Analyze data to derive insights, identify patterns and trends, and make data-driven decisions.",
        "getIcon": [Function],
        "id": "essentials",
        "kind": "card",
        "order": 1000,
        "title": "Essentials",
        "toolTipContent": "Contact your administrator to create a workspace or to be added to an existing one.",
      }
    `);
  });

  it('should return a getTitle function when there are no workspaces and the user is dashboard admin', () => {
    const core = getMockCore([], true);
    registerGetStartedCardToNewHome(core, contentManagementStartMock, registeredUseCases$);

    const calls = registerContentProviderMock.mock.calls;
    expect(calls.length).toBe(1);

    const firstCall = calls[0];
    expect(firstCall[0].getTargetArea()).toMatchInlineSnapshot(`
      Array [
        "osd_homepage/get_started",
      ]
    `);
    expect(firstCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "cardProps": Object {
          "layout": "horizontal",
        },
        "description": "Analyze data to derive insights, identify patterns and trends, and make data-driven decisions.",
        "getIcon": [Function],
        "getTitle": [Function],
        "id": "essentials",
        "kind": "card",
        "order": 1000,
      }
    `);
  });

  it('should return a getTitle function for multiple workspaces', () => {
    const workspaces = [
      { id: 'workspace-1', name: 'workspace 1', features: ['use-case-essentials'] },
      { id: 'workspace-2', name: 'workspace 2', features: ['use-case-essentials'] },
    ];
    const core = getMockCore(workspaces, true);
    registerGetStartedCardToNewHome(core, contentManagementStartMock, registeredUseCases$);

    const calls = registerContentProviderMock.mock.calls;
    expect(calls.length).toBe(1);

    const firstCall = calls[0];
    expect(firstCall[0].getTargetArea()).toMatchInlineSnapshot(`
      Array [
        "osd_homepage/get_started",
      ]
    `);
    expect(firstCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "cardProps": Object {
          "layout": "horizontal",
        },
        "description": "Analyze data to derive insights, identify patterns and trends, and make data-driven decisions.",
        "getIcon": [Function],
        "getTitle": [Function],
        "id": "essentials",
        "kind": "card",
        "order": 1000,
      }
    `);
  });

  it('should return a clickable card when there is one workspace', () => {
    const workspaces = [
      { id: 'workspace-1', name: 'workspace 1', features: ['use-case-essentials'] },
    ];
    const core = getMockCore(workspaces, true);
    registerGetStartedCardToNewHome(core, contentManagementStartMock, registeredUseCases$);

    const calls = registerContentProviderMock.mock.calls;
    expect(calls.length).toBe(1);

    const firstCall = calls[0];
    expect(firstCall[0].getTargetArea()).toMatchInlineSnapshot(`
      Array [
        "osd_homepage/get_started",
      ]
    `);
    expect(firstCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "cardProps": Object {
          "layout": "horizontal",
        },
        "description": "Analyze data to derive insights, identify patterns and trends, and make data-driven decisions.",
        "getIcon": [Function],
        "id": "essentials",
        "kind": "card",
        "onClick": [Function],
        "order": 1000,
        "title": "Essentials",
      }
    `);
  });
});
