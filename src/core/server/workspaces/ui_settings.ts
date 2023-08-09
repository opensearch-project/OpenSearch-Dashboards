/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { schema } from '@osd/config-schema';

import { UiSettingsParams } from 'opensearch-dashboards/server';

export const uiSettings: Record<string, UiSettingsParams> = {
  'workspace:enabled': {
    name: i18n.translate('core.ui_settings.params.workspace.enableWorkspaceTitle', {
      defaultMessage: 'Enable Workspace',
    }),
    value: false,
    requiresPageReload: true,
    description: i18n.translate('core.ui_settings.params.workspace.enableWorkspaceTitle', {
      defaultMessage: 'Enable or disable OpenSearch Dashboards Workspace',
    }),
    category: ['workspace'],
    schema: schema.boolean(),
  },
};
