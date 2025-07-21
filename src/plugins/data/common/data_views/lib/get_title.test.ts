/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsClientContract } from '../../../../../core/public';
import { getTitle } from './get_title';

describe('test getTitle', () => {
  let client: SavedObjectsClientContract;

  it('with dataSourceId match', async () => {
    const dataSourceIdToTitle = new Map();
    dataSourceIdToTitle.set('dataSourceId', 'dataSourceTitle');
    client = {
      get: jest.fn().mockResolvedValue({
        attributes: { title: 'indexTitle' },
        references: [{ type: 'data-source', id: 'dataSourceId' }],
      }),
    } as any;
    const title = await getTitle(client, 'indexPatternId', dataSourceIdToTitle);
    expect(title).toEqual('dataSourceTitle::indexTitle');
  });

  it('with no dataSourceId match and error to get data source', async () => {
    const dataSourceIdToTitle = new Map();
    client = {
      get: jest
        .fn()
        .mockResolvedValueOnce({
          attributes: { title: 'indexTitle' },
          references: [{ type: 'data-source', id: 'dataSourceId' }],
        })
        .mockRejectedValue(new Error('error')),
    } as any;
    const title = await getTitle(client, 'indexPatternId', dataSourceIdToTitle);
    expect(title).toEqual('dataSourceId::indexTitle');
  });

  it('with no dataSourceId match and success to get data source', async () => {
    const dataSourceIdToTitle = new Map();
    client = {
      get: jest
        .fn()
        .mockResolvedValueOnce({
          attributes: { title: 'indexTitle' },
          references: [{ type: 'data-source', id: 'dataSourceId' }],
        })
        .mockResolvedValue({ attributes: { title: 'acquiredDataSourceTitle' } }),
    } as any;
    const title = await getTitle(client, 'indexPatternId', dataSourceIdToTitle);
    expect(title).toEqual('acquiredDataSourceTitle::indexTitle');
  });
});
