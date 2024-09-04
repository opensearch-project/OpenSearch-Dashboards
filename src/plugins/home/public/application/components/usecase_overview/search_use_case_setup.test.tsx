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
          "selectable": Object {
            "children": <EuiI18n
              default="Documentation"
              token="home.searchOverview.setup.accessSearch.footer"
            />,
            "isSelected": false,
            "onClick": [Function],
          },
        },
        "description": "You can run a search using REST API or language client. For experimentation, you can also run queries interactively.",
        "id": "access_search_functionality",
        "kind": "card",
        "order": 10,
        "title": "Access search functionality",
      }
    `);

    // search type section
    const searchTypesCall = registerContentProviderMock.mock.calls[2];
    expect(searchTypesCall[0].getTargetArea()).toEqual('search_overview/different_search_types');
    expect(searchTypesCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "cardProps": Object {
          "children": <div
            className="euiCard__footer"
          >
            <EuiLink
              external={true}
              href="https://opensearch.org/docs/latest/query-dsl/full-text/query-string/"
              target="_blank"
            >
              View Documentation
            </EuiLink>
          </div>,
          "layout": "horizontal",
        },
        "description": "Lexical or keyword search matches documents based on exact words or phrases. Search the text using human-friendly query string query syntax or create complex, customizable queries using Query DSL—the OpenSearch query language.",
        "getIcon": [Function],
        "id": "text_search",
        "kind": "card",
        "order": 10,
        "title": "Text search",
      }
    `);
  });
});
