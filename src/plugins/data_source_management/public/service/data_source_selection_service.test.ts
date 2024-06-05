/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { DataSourceSelectionService } from './data_source_selection_service';
import { generateComponentId } from '../components/utils';

describe('DataSourceSelectionService service', () => {
  it('basic set, get and remove', async () => {
    const dataSourceSelection = new DataSourceSelectionService();
    const id = generateComponentId();
    const dataSource = { id: 'id', label: 'label' };
    expect(dataSourceSelection.getSelectionValue().get(id)).toBe(undefined);
    dataSourceSelection.selectDataSource(id, [dataSource]);
    expect(dataSourceSelection.getSelectionValue().get(id)).toStrictEqual([dataSource]);
    dataSourceSelection.remove(id);
    expect(dataSourceSelection.getSelectionValue().get(id)).toBe(undefined);
  });

  it('multiple set and get', async () => {
    const dataSourceSelection = new DataSourceSelectionService();
    const id1 = generateComponentId();
    const id2 = generateComponentId();

    const dataSource = { id: 'id', label: 'label' };
    expect(dataSourceSelection.getSelectionValue().get(id1)).toBe(undefined);
    expect(dataSourceSelection.getSelectionValue().get(id2)).toBe(undefined);
    dataSourceSelection.selectDataSource(id1, [dataSource]);
    dataSourceSelection.selectDataSource(id2, [dataSource]);
    expect(dataSourceSelection.getSelectionValue().get(id1)).toStrictEqual([dataSource]);
    expect(dataSourceSelection.getSelectionValue().get(id2)).toStrictEqual([dataSource]);
    dataSourceSelection.remove(id1);
    expect(dataSourceSelection.getSelectionValue().get(id1)).toBe(undefined);
    expect(dataSourceSelection.getSelectionValue().get(id2)).toStrictEqual([dataSource]);
  });

  it('support subscribing selected observable', (done) => {
    const dataSourceSelection = new DataSourceSelectionService();
    const selectedDataSource$ = dataSourceSelection.getSelection$();
    const id = generateComponentId();
    const dataSource = { id: 'id', label: 'label' };
    dataSourceSelection.selectDataSource(id, [dataSource]);
    selectedDataSource$.subscribe((newValue) => {
      expect(newValue.get(id)).toStrictEqual([dataSource]);
      done();
    });
  });

  it('should not store same id selection after calling remove', () => {
    const dataSourceSelection = new DataSourceSelectionService();
    const id = generateComponentId();
    const dataSource = { id: 'id', label: 'label' };
    dataSourceSelection.selectDataSource(id, [dataSource]);
    expect(dataSourceSelection.getSelectionValue().get(id)).toStrictEqual([dataSource]);
    dataSourceSelection.remove(id);
    expect(dataSourceSelection.getSelectionValue().get(id)).toStrictEqual(undefined);
    dataSourceSelection.selectDataSource(id, [dataSource]);
    expect(dataSourceSelection.getSelectionValue().get(id)).toStrictEqual(undefined);
  });
});
