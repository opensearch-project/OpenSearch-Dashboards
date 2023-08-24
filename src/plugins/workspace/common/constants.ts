/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { AppCategory } from '../../../core/types';

export const WORKSPACE_CREATE_APP_ID = 'workspace_create';
export const WORKSPACE_LIST_APP_ID = 'workspace_list';
export const WORKSPACE_UPDATE_APP_ID = 'workspace_update';
export const WORKSPACE_OVERVIEW_APP_ID = 'workspace_overview';
export const WORKSPACE_FATAL_ERROR_APP_ID = 'workspace_fatal_error';
export const PATHS = {
  create: '/create',
  overview: '/overview',
  update: '/update',
  list: '/list',
};
export const WORKSPACE_OP_TYPE_CREATE = 'create';
export const WORKSPACE_OP_TYPE_UPDATE = 'update';

export const WORKSPACE_NAV_CATEGORY: AppCategory = {
  id: 'workspace',
  label: i18n.translate('core.ui.workspaceNavList.label', {
    defaultMessage: 'Workspaces',
  }),
  euiIconType: 'folderClosed',
  order: 2000,
};
