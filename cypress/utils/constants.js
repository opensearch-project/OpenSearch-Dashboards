/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './apps/constants';

export const BASE_PATH = Cypress.config('baseUrl');
export const BASE_ENGINE = Cypress.env('ENGINE');
export const SECONDARY_ENGINE = Cypress.env('SECONDARY_ENGINE');

export const PATHS = {
  BASE: BASE_PATH,
  ENGINE: BASE_ENGINE.url,
  SECONDARY_ENGINE: SECONDARY_ENGINE.url,
  STACK_MANAGEMENT: BASE_PATH + '/app/management',
  SECURITY_PLUGIN: BASE_PATH + '/app/security-dashboards-plugin#/',
  TENANTS_MANAGE: BASE_PATH + '/app/security-dashboards-plugin#/tenants',
  INDEX_PATTERNS: BASE_PATH + '/app/management/opensearch-dashboards/indexPatterns',
  SAVED_OBJECTS: BASE_PATH + '/app/management/opensearch-dashboards/objects',
};
