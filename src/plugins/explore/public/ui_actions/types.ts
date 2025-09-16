/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

// Extend UI Actions types for explore-specific triggers and actions
declare module '../../../ui_actions/public' {
  export interface TriggerContextMapping {
    [EXPLORE_DOCUMENT_EXPAND_TRIGGER]: DocumentExpandContext;
    [QUERY_UPDATE_TRIGGER]: QueryUpdateContext;
    [QUERY_RUN_TRIGGER]: QueryRunContext;
  }

  export interface ActionContextMapping {
    [EXPLORE_DOCUMENT_EXPAND_TRIGGER]: DocumentExpandContext;
    [QUERY_UPDATE_TRIGGER]: QueryUpdateContext;
    [QUERY_RUN_TRIGGER]: QueryRunContext;
  }
}

// UI Action Trigger IDs
export const EXPLORE_DOCUMENT_EXPAND_TRIGGER = 'EXPLORE_DOCUMENT_EXPAND_TRIGGER';
export const QUERY_UPDATE_TRIGGER = 'QUERY_UPDATE_TRIGGER';
export const QUERY_RUN_TRIGGER = 'QUERY_RUN_TRIGGER';

// UI Action IDs
export const EXPLORE_DOCUMENT_EXPAND_ACTION = 'EXPLORE_DOCUMENT_EXPAND_ACTION';
export const QUERY_UPDATE_ACTION = 'QUERY_UPDATE_ACTION';
export const QUERY_RUN_ACTION = 'QUERY_RUN_ACTION';

export interface DocumentExpandContext {
  documentId: string;
  action?: string;
}

export interface QueryUpdateContext {
  query: string;
}

export interface QueryRunContext {
  // No specific context needed for running current query
}
