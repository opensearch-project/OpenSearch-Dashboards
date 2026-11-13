/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDatasetForSavedQuery, getStoredSavedQueryDataset } from './saved_query_dataset';

const LOG_GROUPS = { id: 'my-logs::group-a', title: 'group-a', type: 'MY_LOGS_TYPE' };

describe('getDatasetForSavedQuery', () => {
  it('keeps no dataset for an index pattern or an index', () => {
    expect(getDatasetForSavedQuery({ id: 'p', title: 'p', type: 'INDEX_PATTERN' })).toBeUndefined();
    expect(getDatasetForSavedQuery({ id: 'i', title: 'i', type: 'INDEXES' })).toBeUndefined();
    expect(getDatasetForSavedQuery(undefined)).toBeUndefined();
  });

  it("keeps another type's dataset, limited to the fields of the saved query mapping", () => {
    expect(
      getDatasetForSavedQuery({
        ...LOG_GROUPS,
        language: 'FakeQL',
        signalType: 'logs',
        displayName: 'Group A',
        dataSource: { id: 'c', title: 'conn', type: 'SRC', version: '1', meta: { name: 'c' } },
      } as any)
    ).toEqual({
      ...LOG_GROUPS,
      language: 'FakeQL',
      dataSource: { id: 'c', title: 'conn', type: 'SRC', meta: { name: 'c' } },
    });
  });
  it.each(['metrics', 'traces'])(
    'keeps no dataset for a %s source, whose page needs a signal type the mapping has no field for',
    (signalType) => {
      expect(getDatasetForSavedQuery({ ...LOG_GROUPS, signalType } as any)).toBeUndefined();
    }
  );
});

describe('getStoredSavedQueryDataset', () => {
  const queryString = {
    getDatasetService: () => ({
      getType: (type: string) => (type === 'MY_LOGS_TYPE' ? {} : undefined),
    }),
  } as any;
  const service = (dataset: unknown) => ({
    getSavedQuery: jest.fn().mockResolvedValue({ id: 'q', attributes: { query: { dataset } } }),
  });
  const savedQuery = { id: 'q', attributes: { query: { query: 'x', language: 'FakeQL' } } } as any;

  it('reads the stored dataset from the saved object', async () => {
    expect(await getStoredSavedQueryDataset(service(LOG_GROUPS), queryString, savedQuery)).toEqual(
      LOG_GROUPS
    );
  });

  it('does not switch to a stored metrics or traces dataset', async () => {
    expect(
      await getStoredSavedQueryDataset(
        service({ ...LOG_GROUPS, signalType: 'metrics' }),
        queryString,
        savedQuery
      )
    ).toBeUndefined();
  });

  it('gives none for an index pattern, an unregistered type or a failed read', async () => {
    expect(
      await getStoredSavedQueryDataset(
        service({ id: 'p', type: 'INDEX_PATTERN' }),
        queryString,
        savedQuery
      )
    ).toBeUndefined();
    expect(
      await getStoredSavedQueryDataset(
        service({ id: 'x', type: 'GONE_TYPE' }),
        queryString,
        savedQuery
      )
    ).toBeUndefined();
    expect(
      await getStoredSavedQueryDataset(
        { getSavedQuery: jest.fn().mockRejectedValue(new Error('not found')) },
        queryString,
        savedQuery
      )
    ).toBeUndefined();
  });
});
