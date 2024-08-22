/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerSampleDataCard } from './sample_data_card';
import { ContentManagementPluginStart } from '../../../../../../plugins/content_management/public';
import { coreMock } from '../../../../../../core/public/mocks';

describe('Sample data card', () => {
  const coreStart = coreMock.createStart();
  const registerContentProviderMock = jest.fn();

  const contentManagement: ContentManagementPluginStart = {
    registerContentProvider: registerContentProviderMock,
    renderPage: jest.fn(),
    updatePageSection: jest.fn(),
  };

  it('should call the getTargetArea function with the correct arguments', () => {
    registerSampleDataCard(contentManagement, coreStart);
    const call = registerContentProviderMock.mock.calls[0];
    expect(call[0].getTargetArea()).toEqual(['analytics_overview/get_started']);
    expect(call[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "cardProps": Object {
          "selectable": Object {
            "children": <EuiI18n
              default="with Sample Datasets"
              token="home.sampleData.card.footer"
            />,
            "isSelected": false,
            "onClick": [Function],
          },
        },
        "description": "Explore sample data before adding your own.",
        "id": "sample_data",
        "kind": "card",
        "order": 0,
        "title": "Try openSearch",
      }
    `);
  });
});
