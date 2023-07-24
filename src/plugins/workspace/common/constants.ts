/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { AppCategory } from '../../../core/types';

export const WORKSPACE_APP_ID = 'workspace';
export const WORKSPACE_APP_NAME = 'Workspace';

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
