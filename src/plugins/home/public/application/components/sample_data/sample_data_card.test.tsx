/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerSampleDataCard } from './sample_data_card';
import { coreMock } from '../../../../../../core/public/mocks';
import { contentManagementPluginMocks } from '../../../../../content_management/public';

describe('Sample data card', () => {
  const coreStart = coreMock.createStart();
  const registerContentProviderMock = jest.fn();

  const contentManagement = {
    ...contentManagementPluginMocks.createStartContract(),
    registerContentProvider: registerContentProviderMock,
  };

  it('should call the getTargetArea function with the correct arguments', () => {
    registerSampleDataCard(contentManagement, coreStart);
    const call = registerContentProviderMock.mock.calls[0];
    expect(call[0].getTargetArea()).toEqual('essentials_overview/get_started');
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
        "description": "You can install sample data to experiment with OpenSearch Dashboards.",
        "id": "sample_data",
        "kind": "card",
        "order": 0,
        "title": "Try openSearch",
      }
    `);

    // search use case overview
    expect(registerContentProviderMock.mock.calls[1][0].getTargetArea()).toEqual(
      'search_overview/get_started'
    );
  });
});
