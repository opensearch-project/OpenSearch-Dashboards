/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export * from './apps/constants';

// ToDo: `BASE_PATH` need not and should not be used by any test; remove it!
export const BASE_PATH = Cypress.config('baseUrl');

export const BASE_ENGINE = Cypress.env('ENGINE');
// If SECONDARY_ENGINE.url is not provided, use the OpenSearch instance
BASE_ENGINE.url = BASE_ENGINE.url || Cypress.env('openSearchUrl');

export const SECONDARY_ENGINE = Cypress.env('SECONDARY_ENGINE');
// If SECONDARY_ENGINE.url is not provided, use the OpenSearch instance
SECONDARY_ENGINE.url = SECONDARY_ENGINE.url || Cypress.env('openSearchUrl');

export const PATHS = {
  BASE: BASE_PATH,
  ENGINE: BASE_ENGINE ? BASE_ENGINE.url : undefined,
  SECONDARY_ENGINE: SECONDARY_ENGINE ? SECONDARY_ENGINE.url : undefined,
  STACK_MANAGEMENT: BASE_PATH + '/app/management',
  SECURITY_PLUGIN: BASE_PATH + '/app/security-dashboards-plugin#/',
  TENANTS_MANAGE: BASE_PATH + '/app/security-dashboards-plugin#/tenants',
  INDEX_PATTERNS: BASE_PATH + '/app/management/opensearch-dashboards/indexPatterns',
  SAVED_OBJECTS: BASE_PATH + '/app/management/opensearch-dashboards/objects',
};
