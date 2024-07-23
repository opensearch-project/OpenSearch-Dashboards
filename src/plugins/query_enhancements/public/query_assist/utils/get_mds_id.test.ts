/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fieldFormatsMock } from '../../../../data/common/field_formats/mocks';
import { IIndexPattern, IndexPattern, IndexPatternsContract } from '../../../../data/public';
import { getMdsDataSourceId } from './get_mds_id';

describe('GetMdsId', () => {
  const indexPatternContractMock: jest.Mocked<IndexPatternsContract> = ({
    get: jest
      .fn()
      .mockReturnValue(Promise.resolve({ dataSourceRef: { id: 'mock-datasource-id' } })),
  } as unknown) as jest.Mocked<IndexPatternsContract>;

  it('returns dataSource id if given IIndexPattern', async () => {
    const id = await getMdsDataSourceId(indexPatternContractMock, ({
      id: 'mock-id',
    } as unknown) as IIndexPattern);
    expect(id).toEqual('mock-datasource-id');
  });

  it('returns dataSource id if given index pattern entity', async () => {
    const id = await getMdsDataSourceId(
      indexPatternContractMock,
      new IndexPattern({
        spec: {
          id: 'mock-index-pattern-id',
          type: 'index-pattern',
          title: 'test',
          dataSourceRef: { id: 'mock-datasource-id' } as any,
        },
        savedObjectsClient: {} as any,
        fieldFormats: fieldFormatsMock,
        shortDotsEnable: false,
        metaFields: [],
      })
    );
    expect(id).toEqual('mock-datasource-id');
  });

  it('returns undefined if not found', async () => {
    const id = await getMdsDataSourceId(indexPatternContractMock, 'string-index-pattern');
    expect(id).toBeUndefined();
  });
});
