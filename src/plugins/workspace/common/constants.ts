/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const WORKSPACE_CREATE_APP_ID = 'workspace_create';
export const WORKSPACE_LIST_APP_ID = 'workspace_list';
export const WORKSPACE_UPDATE_APP_ID = 'workspace_update';
export const WORKSPACE_OVERVIEW_APP_ID = 'workspace_overview';
export const WORKSPACE_FATAL_ERROR_APP_ID = 'workspace_fatal_error';
export const WORKSPACE_SAVED_OBJECTS_CLIENT_WRAPPER_ID = 'workspace';
export const WORKSPACE_CONFLICT_CONTROL_SAVED_OBJECTS_CLIENT_WRAPPER_ID =
  'workspace_conflict_control';

export enum WorkspacePermissionMode {
  Read = 'read',
  Write = 'write',
  LibraryRead = 'library_read',
  LibraryWrite = 'library_write',
}
