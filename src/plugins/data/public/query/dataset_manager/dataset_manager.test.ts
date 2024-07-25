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

  test('getUpdates$ is a cold emits only after query changes', () => {
    const obs$ = service.getUpdates$();
    const emittedValues: SimpleDataSet[] = [];
    obs$.subscribe((v) => {
      emittedValues.push(v!);
    });

    const newDataSet: SimpleDataSet = { id: 'test_dataset', title: 'Test Dataset' };
    service.setDataSet(newDataSet);
    expect(emittedValues).toHaveLength(2);
    expect(emittedValues[1]).toEqual(newDataSet);

    service.setDataSet({ ...newDataSet });
    expect(emittedValues).toHaveLength(3);
  });
});
