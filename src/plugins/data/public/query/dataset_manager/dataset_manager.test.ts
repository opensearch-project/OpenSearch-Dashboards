/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSetManager } from './dataset_manager';
import { coreMock } from '../../../../../core/public/mocks';
import { SimpleDataSet } from '../../../common';
describe('DataSetManager', () => {
  let service: DataSetManager;

  beforeEach(() => {
    const uiSettingsMock = coreMock.createSetup().uiSettings;
    uiSettingsMock.get.mockReturnValue(true);
    service = new DataSetManager(uiSettingsMock);
  });

  test('getUpdates$ is a cold emits only after dataset changes', () => {
    const obs$ = service.getUpdates$();
    const emittedValues: SimpleDataSet[] = [];
    obs$.subscribe((v) => {
      emittedValues.push(v!);
    });
    expect(emittedValues).toHaveLength(0);
    expect(emittedValues[0]).toEqual(undefined);

    const newDataSet: SimpleDataSet = { id: 'test_dataset', title: 'Test Dataset' };
    service.setDataSet(newDataSet);
    expect(emittedValues).toHaveLength(1);
    expect(emittedValues[0]).toEqual(newDataSet);

    service.setDataSet({ ...newDataSet });
    expect(emittedValues).toHaveLength(2);
  });
});
