/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IIndexPattern, IndexPatternsContract } from '../../../../../src/plugins/data/public';
import { getMdsDataSourceId } from './get_mds_id';

describe('GetMdsId', () => {
  const indexPatternContractMock: jest.Mocked<IndexPatternsContract> = ({
    get: jest
      .fn()
      .mockReturnValue(Promise.resolve({ dataSourceRef: { id: 'mock-datasource-id' } })),
  } as unknown) as jest.Mocked<IndexPatternsContract>;

  it('returns dataSource id', async () => {
    const id = await getMdsDataSourceId(indexPatternContractMock, ({
      id: 'mock-id',
    } as unknown) as IIndexPattern);
    expect(id).toEqual('mock-datasource-id');
  });

  it('returns undefined if not found', async () => {
    const id = await getMdsDataSourceId(indexPatternContractMock, 'string-index-pattern');
    expect(id).toBeUndefined();
  });
});
