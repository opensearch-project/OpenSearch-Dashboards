/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Storage } from '../../../../../opensearch_dashboards_utils/public';

export const DATA_GRID_TABLE_KEY = 'discover:dataGridTable';

export const getDataGridTableSetting = (storage: Storage): boolean => {
  const storedValue = storage.get(DATA_GRID_TABLE_KEY);
  return storedValue !== null ? JSON.parse(storedValue) : false;
};

export const setDataGridTableSetting = (value: boolean, storage: Storage) => {
  storage.set(DATA_GRID_TABLE_KEY, JSON.stringify(value));
};
