/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { appStateFor, drilldownPageReducer, DrilldownPageState } from './page_state';

const base: DrilldownPageState = {
  sourceTypeId: 'opensearch',
  scope: undefined,
  dataSource: { id: 'ds-1', title: 'one', type: 'DATA_SOURCE' } as any,
  dataSourceResolved: true,
  dataSourcePickerKey: 0,
  searchInput: 'abc',
  search: 'abc',
  batchAction: { label: 'x', onClick: () => undefined },
};

describe('drilldownPageReducer', () => {
  it('a source switch drops the scope, search and batch action, and keeps the data source', () => {
    const next = drilldownPageReducer(
      { ...base, sourceTypeId: 'stream-source', scope: { zone: 'z' } },
      { type: 'selectSource', sourceTypeId: 'other' }
    );
    expect(next).toMatchObject({
      sourceTypeId: 'other',
      scope: undefined,
      searchInput: '',
      search: '',
      batchAction: null,
      dataSource: base.dataSource,
    });
  });

  it('keeps the same state for the same scope in another key order', () => {
    const state = { ...base, sourceTypeId: 'stream-source', scope: { zone: 'z', tenant: 'a' } };
    expect(
      drilldownPageReducer(state, { type: 'setScope', scope: { tenant: 'a', zone: 'z' } })
    ).toBe(state);
  });

  it('an empty picker selection is unresolved, with no data source', () => {
    expect(
      drilldownPageReducer(base, { type: 'setDataSource', dataSource: undefined })
    ).toMatchObject({ dataSource: undefined, dataSourceResolved: false });
  });

  describe('applyExternalAppState', () => {
    const known = ['opensearch', 'stream-source'];

    it("doesn't trust a URL data source until the picker confirms it", () => {
      const next = drilldownPageReducer(base, {
        type: 'applyExternalAppState',
        appState: { dataSource: { id: 'ds-9', title: 'nine', type: 'DATA_SOURCE' } as any },
        knownSourceTypeIds: known,
      });
      expect(next).toMatchObject({
        dataSource: { id: 'ds-9' },
        dataSourceResolved: false,
        dataSourcePickerKey: 1,
      });
      expect(
        drilldownPageReducer(next, {
          type: 'setDataSource',
          dataSource: { id: 'ds-9', title: 'nine', type: 'DATA_SOURCE' } as any,
        }).dataSourceResolved
      ).toBe(true);
    });

    it('switches to a known source with its scope, and ignores an unknown one', () => {
      expect(
        drilldownPageReducer(base, {
          type: 'applyExternalAppState',
          appState: { sourceType: 'stream-source', scope: { zone: 'z' } },
          knownSourceTypeIds: known,
        })
      ).toMatchObject({ sourceTypeId: 'stream-source', scope: { zone: 'z' }, search: '' });
      expect(
        drilldownPageReducer(base, {
          type: 'applyExternalAppState',
          appState: { sourceType: 'gone' },
          knownSourceTypeIds: known,
        }).sourceTypeId
      ).toBe('opensearch');
    });

    it('changes nothing for its own state read back in another key order', () => {
      const state = {
        ...base,
        sourceTypeId: 'stream-source',
        scope: { zone: 'z', tenant: 'a' },
      };
      expect(
        drilldownPageReducer(state, {
          type: 'applyExternalAppState',
          appState: {
            dataSource: base.dataSource,
            scope: { tenant: 'a', zone: 'z' },
            sourceType: 'stream-source',
          },
          knownSourceTypeIds: known,
        })
      ).toBe(state);
    });
  });
});

describe('appStateFor', () => {
  it('keeps other keys, and writes no source type or scope for OpenSearch', () => {
    expect(
      appStateFor(base, { other: 1, sourceType: 'stream-source', scope: { zone: 'z' } } as any)
    ).toEqual({
      other: 1,
      dataSource: base.dataSource,
    });
  });

  it('writes the source type and scope of a registered source', () => {
    expect(
      appStateFor(
        { sourceTypeId: 'stream-source', scope: { zone: 'z' }, dataSource: undefined },
        null
      )
    ).toEqual({ sourceType: 'stream-source', scope: { zone: 'z' } });
  });
});
