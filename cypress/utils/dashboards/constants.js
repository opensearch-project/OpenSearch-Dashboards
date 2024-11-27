/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from '../base_constants';

// STACK MANAGEMENT PATH
export const STACK_MANAGEMENT_PATH = BASE_PATH + '/app/management';
export const SECURITY_PLUGIN_PATH = BASE_PATH + '/app/security-dashboards-plugin#/';

export const TENANTS_MANAGE_PATH = BASE_PATH + '/app/security-dashboards-plugin#/tenants';

export const INDEX_PATTERN_PATH = STACK_MANAGEMENT_PATH + '/opensearch-dashboards/indexPatterns';
export const SAVED_OBJECTS_PATH = STACK_MANAGEMENT_PATH + '/opensearch-dashboards/objects';

export * from './query_enhancement/constants';
