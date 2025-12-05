/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const CURRENT_TENANT = {
  defaultTenant: 'global',
  set newTenant(changedTenant) {
    this.defaultTenant = changedTenant;
  },
};

export * from './query_enhancements/constants';
