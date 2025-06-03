/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Storage } from '../../../../../opensearch_dashboards_utils/public';

/**
 * @deprecated - We will only support legacy discover
 */
export const NEW_DISCOVER_KEY = 'discover:newExpereince';

/**
 * @deprecated - We will only support legacy discover
 */
export const getNewDiscoverSetting = (storage: Storage): boolean => {
  const storedValue = storage.get(NEW_DISCOVER_KEY);
  return storedValue !== null ? storedValue : false;
};

/**
 * @deprecated - We will only support legacy discover
 */
export const setNewDiscoverSetting = (value: boolean, storage: Storage) => {
  storage.set(NEW_DISCOVER_KEY, value);
};
