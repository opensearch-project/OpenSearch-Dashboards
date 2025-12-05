/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { dataViewLoad } from './load_data_view';

jest.mock('../../services', () => ({
  getDataViews: () => ({
    get: (id: string) => ({
      toSpec: () => ({
        title: 'value',
      }),
    }),
  }),
}));

describe('dataView expression function', () => {
  test('returns serialized index pattern', async () => {
    const dataViewDefinition = dataViewLoad();
    const result = await dataViewDefinition.fn(null, { id: '1' }, {} as any);
    expect(result.type).toEqual('data_view');
    expect(result.value.title).toEqual('value');
  });
});
