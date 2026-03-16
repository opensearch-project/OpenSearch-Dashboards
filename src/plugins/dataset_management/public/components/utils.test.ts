/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDatasets } from './utils';
import { coreMock } from '../../../../core/public/mocks';
import { mockManagementPlugin } from '../mocks';

const { savedObjects } = coreMock.createStart();
const mockManagementPluginStart = mockManagementPlugin.createStartContract();

(savedObjects.client.find as jest.Mock).mockResolvedValue({
  savedObjects: [
    {
      id: 'test',
      get: () => {
        return 'test name';
      },
    },
    {
      id: 'test1',
      get: () => {
        return 'test name 1';
      },
    },
  ],
});

test('getting index patterns', async () => {
  const indexPatterns = await getDatasets(savedObjects.client, 'test', mockManagementPluginStart);
  expect(indexPatterns).toMatchSnapshot();
});
