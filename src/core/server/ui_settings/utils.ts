/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UiSettingScope } from './types';

export const CURRENT_USER_PLACEHOLDER = '<current_user>';
export const CURRENT_WORKSPACE_PLACEHOLDER = '<current_workspace>';

export const DASHBOARD_ADMIN_SETTINGS_ID = '_dashboard_admin';

export const PERMISSION_CONTROLLED_UI_SETTINGS_WRAPPER_ID = 'permission-control-ui-settings';
// The wrapper handles the dashboard admin settings independently and will never conflict with
// other wrappers, therefore the priorty can be any number and the priority of 100 is trival
export const PERMISSION_CONTROLLED_UI_SETTINGS_WRAPPER_PRIORITY = 100;

export const buildDocIdWithScope = (id: string, scope?: UiSettingScope) => {
  if (scope === UiSettingScope.USER) {
    return `${CURRENT_USER_PLACEHOLDER}_${id}`;
  }
  if (scope === UiSettingScope.DASHBOARD_ADMIN) {
    return DASHBOARD_ADMIN_SETTINGS_ID;
  }
  if (scope === UiSettingScope.WORKSPACE) {
    return `${CURRENT_WORKSPACE_PLACEHOLDER}_${id}`;
  }
  return id;
};
