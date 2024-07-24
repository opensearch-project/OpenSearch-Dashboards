/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSetManager } from './dataset_manager';
import { coreMock } from '../../../../../core/public/mocks';
import { SimpleDataSet } from '../../../common/data_sets';

describe('DataSetManager', () => {
  let service: DataSetManager;

  beforeEach(() => {
    service = new DataSetManager(coreMock.createSetup().uiSettings);
  });

  test('getUpdates$ emits initially and after data set changes', () => {
    const obs$ = service.getUpdates$();
    const emittedValues: Array<SimpleDataSet | undefined> = [];
    obs$.subscribe((v) => {
      emittedValues.push(v);
    });
    expect(emittedValues).toHaveLength(1);
    expect(emittedValues[1]).toEqual(undefined);

    const newDataSet: SimpleDataSet = { id: 'test_dataset', title: 'Test Dataset' };
    service.setDataSet(newDataSet);
    expect(emittedValues).toHaveLength(2);
    expect(emittedValues[1]).toEqual(newDataSet);

    service.setDataSet({ ...newDataSet });
    expect(emittedValues).toHaveLength(3);
  });
});
