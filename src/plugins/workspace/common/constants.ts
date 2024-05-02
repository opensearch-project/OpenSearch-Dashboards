/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { AppCategory } from '../../../core/types';

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
export const WORKSPACE_UI_SETTINGS_CLIENT_WRAPPER_ID = 'workspace_ui_settings';

export enum WorkspacePermissionMode {
  Read = 'read',
  Write = 'write',
  LibraryRead = 'library_read',
  LibraryWrite = 'library_write',
}

export const WORKSPACE_ID_CONSUMER_WRAPPER_ID = 'workspace_id_consumer';

/**
 * The priority for these wrappers matters:
 * 1. WORKSPACE_ID_CONSUMER wrapper should be the first wrapper to execute, as it will add the `workspaces` field
 * to `options` based on the request, which will be honored by permission control wrapper and conflict wrapper.
 * 2. The order of permission wrapper and conflict wrapper does not matter as no dependency between these two wrappers.
 */
export const PRIORITY_FOR_WORKSPACE_ID_CONSUMER_WRAPPER = -3;
export const PRIORITY_FOR_WORKSPACE_UI_SETTINGS_WRAPPER = -2;
export const PRIORITY_FOR_WORKSPACE_CONFLICT_CONTROL_WRAPPER = -1;
export const PRIORITY_FOR_PERMISSION_CONTROL_WRAPPER = 0;

export const WORKSPACE_APP_CATEGORIES: Record<string, AppCategory> = Object.freeze({
  // below categories are for workspace
  getStarted: {
    id: 'getStarted',
    label: i18n.translate('core.ui.getStarted.label', {
      defaultMessage: 'Get started',
    }),
    order: 10000,
  },
  dashboardAndReport: {
    id: 'dashboardReport',
    label: i18n.translate('core.ui.dashboardReport.label', {
      defaultMessage: 'Dashboard and report',
    }),
    order: 11000,
  },
  investigate: {
    id: 'investigate',
    label: i18n.translate('core.ui.investigate.label', {
      defaultMessage: 'Investigate',
    }),
    order: 12000,
  },
  detect: {
    id: 'detect',
    label: i18n.translate('core.ui.detect.label', {
      defaultMessage: 'Detect',
    }),
    order: 13000,
  },
  searchSolution: {
    id: 'searchSolution',
    label: i18n.translate('core.ui.searchSolution.label', {
      defaultMessage: 'Build search solution',
    }),
    order: 14000,
  },
});
