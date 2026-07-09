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
import {
  getDataSourceIdFromIndexPattern,
  getIndexPatternTitle,
  validateDataSourceReference,
} from './utils';

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
  const indexPatternMockTitle = 'indexPatternMockTitle';
  // @ts-expect-error TS2741 TODO(ts-error): fixme
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
    expect(res).toEqual('dataSourceMockTitle::indexPatternMockTitle');
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
    expect(res).toEqual('dataSourceId::indexPatternMockTitle');
  });
});

describe('test getDataSourceIdFromIndexPattern', () => {
  test('returns the id from data-source reference when present', () => {
    expect(
      getDataSourceIdFromIndexPattern({
        id: 'logs-*',
        references: [{ id: 'ds-1', type: 'data-source', name: 'dataSource' }],
      })
    ).toBe('ds-1');
  });

  test('falls back to splitting the id on `::` when references are absent', () => {
    expect(
      getDataSourceIdFromIndexPattern({
        id: 'ds-2::logs-*',
        references: [],
      })
    ).toBe('ds-2');
  });

  test('falls back to splitting the id when references is undefined', () => {
    expect(
      getDataSourceIdFromIndexPattern({
        id: 'ds-3::logs-*',
      })
    ).toBe('ds-3');
  });

  test('prefers the references entry over the namespaced id', () => {
    expect(
      getDataSourceIdFromIndexPattern({
        id: 'ds-stale::logs-*',
        references: [{ id: 'ds-current', type: 'data-source', name: 'dataSource' }],
      })
    ).toBe('ds-current');
  });

  test('returns undefined when neither encoding has a data source', () => {
    expect(
      getDataSourceIdFromIndexPattern({
        id: 'logs-*',
        references: [],
      })
    ).toBeUndefined();
  });

  test('ignores non-data-source references', () => {
    expect(
      getDataSourceIdFromIndexPattern({
        id: 'logs-*',
        references: [{ id: 'space-1', type: 'space', name: 'space' }],
      })
    ).toBeUndefined();
  });
});
