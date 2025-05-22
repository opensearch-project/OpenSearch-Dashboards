/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { httpServiceMock } from '../../../../core/public/mocks';
import { catIndices, CatIndicesProps } from './cat_indices';

describe('catIndices()', () => {
  const httpMock = httpServiceMock.createStartContract();
  const mockIndexNames = ['foo', 'bar'];
  httpMock.get.mockResolvedValue({
    indices: mockIndexNames,
  });

  it.each<CatIndicesProps>([
    {
      http: httpMock,
      dataSourceId: undefined,
    },
    {
      http: httpMock,
      dataSourceId: 'data-source-id',
    },
  ])(
    'should call /api/data_importer/_cat_indices with the correct args when dataSourceId is $dataSourceId',
    async ({ http, dataSourceId }) => {
      const response = await catIndices({ http, dataSourceId });
      expect(response.indices).toMatchObject([...mockIndexNames]);
      expect(http.get).toBeCalledWith('/api/data_importer/_cat_indices', {
        ...(dataSourceId && { query: { dataSource: dataSourceId } }),
      });
    }
  );
});
