/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PLUGIN_ID = 'dataSourceManagement';
export const PLUGIN_NAME = 'Data sources';
export const DEFAULT_DATA_SOURCE_UI_SETTINGS_ID = 'defaultDataSource';
export * from './types';
export const DATA_SOURCE_PERMISSION_CLIENT_WRAPPER_ID = 'data-source-permission';
// Run data source permission wrapper behind all other wrapper.
export const ORDER_FOR_DATA_SOURCE_PERMISSION_WRAPPER = 50;
export const DEFAULT_INDEX_PATTERN_UI_SETTINGS_ID = 'defaultIndex';
