/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { AuthType, DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { IndexPatternSavedObjectAttrs } from './index_patterns';
import { SavedObject, SavedObjectReference } from './types';
import { getIndexPatternTitle, validateDataSourceReference } from './utils';

describe('test validateDataSourceReference', () => {
  const getIndexPatternSavedObjectMock = (mockedFields: any = {}) =>
    ({ ...mockedFields } as SavedObject<IndexPatternSavedObjectAttrs>);
  let indexPatternSavedObjectMock;
  const dataSourceId = 'fakeDataSourceId';

  test('ivalidateDataSourceReference should return false when datasource reference does not exist in index pattern', () => {
    indexPatternSavedObjectMock = getIndexPatternSavedObjectMock({
      references: [{ name: 'someReference' }],
    });

    expect(validateDataSourceReference(indexPatternSavedObjectMock)).toBe(false);
    expect(validateDataSourceReference(indexPatternSavedObjectMock, dataSourceId)).toBe(false);
  });

  test('ivalidateDataSourceReference should return true when datasource reference exists in index pattern, and datasource id matches', () => {
    indexPatternSavedObjectMock = getIndexPatternSavedObjectMock({
      references: [{ type: 'data-source', id: dataSourceId }],
    });

    expect(validateDataSourceReference(indexPatternSavedObjectMock)).toBe(false);
    expect(validateDataSourceReference(indexPatternSavedObjectMock, dataSourceId)).toBe(true);
  });
});

describe('test getIndexPatternTitle', () => {
  const dataSourceMock: SavedObject<DataSourceAttributes> = {
    id: 'dataSourceId',
    type: 'data-source',
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
  const indexPatternMockTitle = 'indexPatternMockTitle';
  const referencesMock: SavedObjectReference[] = [{ type: 'data-source', id: 'dataSourceId' }];

  let getDataSourceMock: jest.Mock<any, any>;

  beforeEach(() => {
    getDataSourceMock = jest.fn().mockResolvedValue(dataSourceMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('getIndexPatternTitle should concat datasource title with index pattern title', async () => {
    const res = await getIndexPatternTitle(
      indexPatternMockTitle,
      referencesMock,
      getDataSourceMock
    );
    expect(res).toEqual('dataSourceMockTitle.indexPatternMockTitle');
  });

  test('getIndexPatternTitle should return index pattern title, when index-pattern is not referenced to any datasource', async () => {
    const res = await getIndexPatternTitle(indexPatternMockTitle, [], getDataSourceMock);
    expect(res).toEqual('indexPatternMockTitle');
  });

  test('getIndexPatternTitle should return index pattern title, when failing to fetch datasource info', async () => {
    getDataSourceMock = jest.fn().mockRejectedValue(new Error('error'));
    const res = await getIndexPatternTitle(
      indexPatternMockTitle,
      referencesMock,
      getDataSourceMock
    );
    expect(res).toEqual('dataSourceId.indexPatternMockTitle');
  });
});
