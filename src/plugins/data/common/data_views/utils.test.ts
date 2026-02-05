/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType, DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { DataViewSavedObjectAttrs } from './data_views';
import { SavedObject, DataViewSavedObjectReference } from './types';
import { getDataViewTitle, validateDataViewDataSourceReference } from './utils';

describe('test validateDataViewDataSourceReference', () => {
  const getDataViewSavedObjectMock = (mockedFields: any = {}) =>
    ({ ...mockedFields } as SavedObject<DataViewSavedObjectAttrs>);
  let dataViewSavedObjectMock;
  const dataSourceId = 'fakeDataSourceId';

  test('ivalidateDataViewDataSourceReference should return false when datasource reference does not exist in index pattern', () => {
    dataViewSavedObjectMock = getDataViewSavedObjectMock({
      references: [{ name: 'someReference' }],
    });

    expect(validateDataViewDataSourceReference(dataViewSavedObjectMock)).toBe(false);
    expect(validateDataViewDataSourceReference(dataViewSavedObjectMock, dataSourceId)).toBe(false);
  });

  test('ivalidateDataViewDataSourceReference should return true when datasource reference exists in index pattern, and datasource id matches', () => {
    dataViewSavedObjectMock = getDataViewSavedObjectMock({
      references: [{ type: 'data-source', id: dataSourceId }],
    });

    expect(validateDataViewDataSourceReference(dataViewSavedObjectMock)).toBe(false);
    expect(validateDataViewDataSourceReference(dataViewSavedObjectMock, dataSourceId)).toBe(true);
  });
});

describe('test getDataViewTitle', () => {
  const dataSourceMock: SavedObject<DataSourceAttributes> = {
    id: 'dataSourceId',
    type: 'data-source',
    // @ts-expect-error TS2741 TODO(ts-error): fixme
    attributes: {
      title: 'dataSourceMockTitle',
      endpoint: 'https://fakeendpoint.com',
      auth: {
        type: AuthType.NoAuth,
        credentials: undefined,
      },
    },
    references: [],
  };
  const dataViewMockTitle = 'dataViewMockTitle';
  const referencesMock: DataViewSavedObjectReference[] = [
    // @ts-expect-error TS2741 TODO(ts-error): fixme
    { type: 'data-source', id: 'dataSourceId' },
  ];

  let getDataSourceMock: jest.Mock<any, any>;

  beforeEach(() => {
    getDataSourceMock = jest.fn().mockResolvedValue(dataSourceMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('getDataViewTitle should concat datasource title with index pattern title', async () => {
    const res = await getDataViewTitle(dataViewMockTitle, referencesMock, getDataSourceMock);
    expect(res).toEqual('dataSourceMockTitle::dataViewMockTitle');
  });

  test('getDataViewTitle should return index pattern title, when index-pattern is not referenced to any datasource', async () => {
    const res = await getDataViewTitle(dataViewMockTitle, [], getDataSourceMock);
    expect(res).toEqual('dataViewMockTitle');
  });

  test('getDataViewTitle should return index pattern title, when failing to fetch datasource info', async () => {
    getDataSourceMock = jest.fn().mockRejectedValue(new Error('error'));
    const res = await getDataViewTitle(dataViewMockTitle, referencesMock, getDataSourceMock);
    expect(res).toEqual('dataSourceId::dataViewMockTitle');
  });
});
