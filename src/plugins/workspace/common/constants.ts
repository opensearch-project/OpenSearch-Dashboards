/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const WORKSPACE_FATAL_ERROR_APP_ID = 'workspace_fatal_error';
export const WORKSPACE_CREATE_APP_ID = 'workspace_create';
export const WORKSPACE_LIST_APP_ID = 'workspace_list';
export const WORKSPACE_UPDATE_APP_ID = 'workspace_update';
export const WORKSPACE_OVERVIEW_APP_ID = 'workspace_overview';
/**
 * Since every workspace always have overview and update page, these features will be selected by default
 * and can't be changed in the workspace form feature selector
 */
export const DEFAULT_SELECTED_FEATURES_IDS = [WORKSPACE_UPDATE_APP_ID, WORKSPACE_OVERVIEW_APP_ID];
export const WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID = 'workspace';
export const WORKSPACE_CONFLICT_CONTROL_SAVED_OBJECTS_CLIENT_WRAPPER_ID =
  'workspace_conflict_control';
