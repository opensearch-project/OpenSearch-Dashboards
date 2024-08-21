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
        "id": "analytics_overview",
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
    expect(calls.length).toBe(5);

    const firstCall = calls[0];
    expect(firstCall[0].getTargetArea()).toMatchInlineSnapshot(`"analytics_overview/get_started"`);
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

    const whatsNew = calls[3];
    expect(whatsNew[0].getTargetArea()).toMatchInlineSnapshot(`"analytics_overview/service_cards"`);
    expect(whatsNew[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "id": "whats_new",
        "kind": "custom",
        "order": 10,
        "render": [Function],
        "width": 24,
      }
    `);

    const learnOpenSearch = calls[4];
    expect(learnOpenSearch[0].getTargetArea()).toMatchInlineSnapshot(
      `"analytics_overview/service_cards"`
    );
    expect(learnOpenSearch[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "id": "learn_opensearch",
        "kind": "custom",
        "order": 20,
        "render": [Function],
        "width": 24,
      }
    `);
  });

  it('setAnalyticsAllOverviewSection', () => {
    setEssentialOverviewSection(contentManagementSetupMock);

    const call = registerPageMock.mock.calls[0];
    expect(call[0]).toMatchInlineSnapshot(`
      Object {
        "id": "analytics_overview",
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
    expect(calls.length).toBe(5);

    const firstCall = calls[0];
    expect(firstCall[0].getTargetArea()).toMatchInlineSnapshot(`"all_overview/get_started"`);
    expect(firstCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "cardProps": Object {
          "layout": "horizontal",
        },
        "description": "Gain visibility into system health, performance, and reliability through monitoring and analysis of logs, metrics, and traces.",
        "getIcon": [Function],
        "id": "observability",
        "kind": "card",
        "onClick": [Function],
        "order": 4000,
        "title": "Observability",
      }
    `);

    const whatsNew = calls[3];
    expect(whatsNew[0].getTargetArea()).toMatchInlineSnapshot(`"all_overview/service_cards"`);
    expect(whatsNew[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "id": "whats_new",
        "kind": "custom",
        "order": 30,
        "render": [Function],
        "width": 12,
      }
    `);

    const learnOpenSearch = calls[4];
    expect(learnOpenSearch[0].getTargetArea()).toMatchInlineSnapshot(
      `"all_overview/service_cards"`
    );
    expect(learnOpenSearch[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "id": "learn_opensearch",
        "kind": "custom",
        "order": 40,
        "render": [Function],
        "width": 12,
      }
    `);
  });
});
