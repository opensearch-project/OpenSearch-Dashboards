/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './services';
export * from './store';
export * from './chart_utils';
export * from './data_factories';

export const setupTestMocks = () => {
  jest.clearAllMocks();
};

export const resetTestMocks = () => {
  jest.resetAllMocks();
};
