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
      { ...base, sourceTypeId: 'cw', scope: { region: 'r' } },
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
    const state = { ...base, sourceTypeId: 'cw', scope: { region: 'r', accountId: 'a' } };
    expect(
      drilldownPageReducer(state, { type: 'setScope', scope: { accountId: 'a', region: 'r' } })
    ).toBe(state);
  });

  it('an empty picker selection is unresolved, with no data source', () => {
    expect(
      drilldownPageReducer(base, { type: 'setDataSource', dataSource: undefined })
    ).toMatchObject({ dataSource: undefined, dataSourceResolved: false });
  });

  describe('applyExternalAppState', () => {
    const known = ['opensearch', 'cw'];

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
          appState: { sourceType: 'cw', scope: { region: 'r' } },
          knownSourceTypeIds: known,
        })
      ).toMatchObject({ sourceTypeId: 'cw', scope: { region: 'r' }, search: '' });
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
        sourceTypeId: 'cw',
        scope: { region: 'r', accountId: 'a' },
      };
      expect(
        drilldownPageReducer(state, {
          type: 'applyExternalAppState',
          appState: {
            dataSource: base.dataSource,
            scope: { accountId: 'a', region: 'r' },
            sourceType: 'cw',
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
      appStateFor(base, { other: 1, sourceType: 'cw', scope: { region: 'r' } } as any)
    ).toEqual({
      other: 1,
      dataSource: base.dataSource,
    });
  });

  it('writes the source type and scope of a registered source', () => {
    expect(
      appStateFor({ sourceTypeId: 'cw', scope: { region: 'r' }, dataSource: undefined }, null)
    ).toEqual({ sourceType: 'cw', scope: { region: 'r' } });
  });
});
