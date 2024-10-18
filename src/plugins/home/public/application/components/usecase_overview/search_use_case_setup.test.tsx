/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { coreMock } from '../../../../../../core/public/mocks';
import { contentManagementPluginMocks } from '../../../../../content_management/public/mocks';
import { registerContentToSearchUseCasePage, setupSearchUseCase } from './search_use_case_setup';

describe('Search use case setup', () => {
  const coreStart = coreMock.createStart();
  const registerContentProviderMock = jest.fn();
  const registerPageMock = jest.fn();

  const contentManagementSetupMock = {
    ...contentManagementPluginMocks.createSetupContract(),
    registerPage: registerPageMock,
  };

  const contentManagementStartMock = {
    ...contentManagementPluginMocks.createStartContract(),
    registerContentProvider: registerContentProviderMock,
  };

  it('setupSearchUseCase', () => {
    setupSearchUseCase(contentManagementSetupMock);
    expect(registerPageMock).toHaveBeenCalledTimes(1);

    const call = registerPageMock.mock.calls[0];
    expect(call[0]).toMatchInlineSnapshot(`
      Object {
        "id": "search_overview",
        "sections": Array [
          Object {
            "id": "get_started",
            "kind": "card",
            "order": 1000,
            "title": "Set up search",
          },
          Object {
            "columns": 2,
            "grid": true,
            "id": "different_search_types",
            "kind": "card",
            "order": 2000,
            "title": "Try out different search techniques",
          },
          Object {
            "columns": 2,
            "grid": true,
            "id": "config_evaluate_search",
            "kind": "card",
            "order": 3000,
            "title": "Configure and evaluate search",
          },
        ],
        "title": "Overview",
      }
    `);
  });

  it('registerContentToSearchUseCasePage', () => {
    registerContentToSearchUseCasePage(contentManagementStartMock, coreStart);

    const call = registerContentProviderMock.mock.calls[0];
    expect(call[0].getTargetArea()).toEqual('search_overview/get_started');
    expect(call[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "cardProps": Object {
          "className": "usecaseOverviewGettingStartedCard",
        },
        "description": "Explore search capabilities and functionality of OpenSearch.",
        "getFooter": [Function],
        "getIcon": [Function],
        "id": "access_search_functionality",
        "kind": "card",
        "onClick": [Function],
        "order": 10,
        "title": "",
      }
    `);

    // search type section
    const searchTypesCall = registerContentProviderMock.mock.calls[2];
    expect(searchTypesCall[0].getTargetArea()).toEqual('search_overview/get_started');
    expect(searchTypesCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "cardProps": Object {
          "className": "usecaseOverviewGettingStartedCard",
        },
        "description": "Explore data to uncover and discover insights.",
        "getFooter": [Function],
        "getIcon": [Function],
        "id": "get_start_discover",
        "kind": "card",
        "onClick": [Function],
        "order": 30,
        "title": "",
      }
    `);
  });
});
