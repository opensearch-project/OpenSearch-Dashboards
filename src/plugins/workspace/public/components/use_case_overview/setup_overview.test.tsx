/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ContentManagementPluginSetup,
  ContentManagementPluginStart,
} from '../../../../../plugins/content_management/public';
import { coreMock } from '../../../../../core/public/mocks';
import {
  registerAnalyticsAllOverviewContent,
  registerEssentialOverviewContent,
  setEssentialOverviewSection,
} from './setup_overview';

describe('Setup use case overview', () => {
  const coreStart = coreMock.createStart();
  const registerContentProviderMock = jest.fn();

  const contentManagementStartMock: ContentManagementPluginStart = {
    registerContentProvider: registerContentProviderMock,
    renderPage: jest.fn(),
    updatePageSection: jest.fn(),
  };

  const registerPageMock = jest.fn();
  const contentManagementSetupMock: ContentManagementPluginSetup = {
    registerPage: registerPageMock,
  };

  beforeEach(() => {
    registerContentProviderMock.mockClear();
  });

  it('setEssentialOverviewSection', () => {
    setEssentialOverviewSection(contentManagementSetupMock);

    const call = registerPageMock.mock.calls[0];
    expect(call[0]).toMatchInlineSnapshot(`
      Object {
        "id": "essentials_overview",
        "sections": Array [
          Object {
            "id": "service_cards",
            "kind": "dashboard",
            "order": 3000,
          },
          Object {
            "id": "recently_viewed",
            "kind": "custom",
            "order": 2000,
            "render": [Function],
            "title": "Recently viewed",
          },
          Object {
            "id": "get_started",
            "kind": "card",
            "order": 1000,
          },
        ],
        "title": "Overview",
      }
    `);
  });

  it('registerEssentialOverviewContent', () => {
    registerEssentialOverviewContent(contentManagementStartMock, coreStart);

    const calls = registerContentProviderMock.mock.calls;
    expect(calls.length).toBe(3);

    const firstCall = calls[0];
    expect(firstCall[0].getTargetArea()).toMatchInlineSnapshot(`"essentials_overview/get_started"`);
    expect(firstCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "cardProps": Object {
          "selectable": Object {
            "children": <EuiI18n
              default="with Discover"
              token="workspace.essential_overview.discover.card.footer"
            />,
            "isSelected": false,
            "onClick": [Function],
          },
        },
        "description": "Explore data interactively to uncover insights.",
        "id": "get_start_discover",
        "kind": "card",
        "order": 20,
        "title": "Discover insights",
      }
    `);
  });

  it('setAnalyticsAllOverviewSection', () => {
    setEssentialOverviewSection(contentManagementSetupMock);

    const call = registerPageMock.mock.calls[0];
    expect(call[0]).toMatchInlineSnapshot(`
      Object {
        "id": "essentials_overview",
        "sections": Array [
          Object {
            "id": "service_cards",
            "kind": "dashboard",
            "order": 3000,
          },
          Object {
            "id": "recently_viewed",
            "kind": "custom",
            "order": 2000,
            "render": [Function],
            "title": "Recently viewed",
          },
          Object {
            "id": "get_started",
            "kind": "card",
            "order": 1000,
          },
        ],
        "title": "Overview",
      }
    `);
  });

  it('registerAnalyticsAllOverviewContent', () => {
    registerAnalyticsAllOverviewContent(contentManagementStartMock, coreStart);

    const calls = registerContentProviderMock.mock.calls;
    expect(calls.length).toBe(3);

    const firstCall = calls[0];
    expect(firstCall[0].getTargetArea()).toMatchInlineSnapshot(`"all_overview/get_started"`);
    expect(firstCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "cardProps": Object {
          "layout": "horizontal",
        },
        "description": "Gain visibility into your application and infrastructure",
        "getIcon": [Function],
        "id": "observability",
        "kind": "card",
        "onClick": [Function],
        "order": 4000,
        "title": "Observability",
      }
    `);
  });
});
