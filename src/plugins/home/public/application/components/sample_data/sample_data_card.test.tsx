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
          "className": "usecaseOverviewGettingStartedCard",
        },
        "description": "Install sample data to experiment with OpenSearch.",
        "getFooter": [Function],
        "getIcon": [Function],
        "id": "sample_data",
        "kind": "card",
        "onClick": [Function],
        "order": 0,
        "title": "",
      }
    `);
  });
});
