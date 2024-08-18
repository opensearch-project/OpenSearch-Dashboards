/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetManager } from './dataset_manager';
import { coreMock } from '../../../../../../core/public/mocks';
import { Dataset } from '../../../../common';

describe('DatasetManager', () => {
  let service: DatasetManager;

  beforeEach(() => {
    const uiSettingsMock = coreMock.createSetup().uiSettings;
    uiSettingsMock.get.mockReturnValue(true);
    service = new DatasetManager(uiSettingsMock);
  });

  test('getUpdates$ is a cold emits only after dataset changes', () => {
    const obs$ = service.getUpdates$();
    const emittedValues: Dataset[] = [];
    obs$.subscribe((v) => {
      emittedValues.push(v!);
    });
    expect(emittedValues).toHaveLength(0);
    expect(emittedValues[0]).toEqual(undefined);

    const newDataset: Dataset = {
      id: 'test_dataset',
      title: 'Test Dataset',
      type: 'INDEX_PATTERN',
    };
    service.setDataset(newDataset);
    expect(emittedValues).toHaveLength(1);
    expect(emittedValues[0]).toEqual(newDataset);

    service.setDataset({ ...newDataset });
    expect(emittedValues).toHaveLength(2);
  });
});
