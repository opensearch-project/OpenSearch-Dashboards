/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';

import { UiSettingsParams } from 'opensearch-dashboards/server';
import { i18n } from '@osd/i18n';
import { UiSettingScope } from '../../../core/server';
import {
  ANALYTICS_WORKSPACE_DISMISS_GET_STARTED,
  DEFAULT_WORKSPACE,
  ESSENTIAL_WORKSPACE_DISMISS_GET_STARTED,
} from '../common/constants';

export const uiSettings: Record<string, UiSettingsParams> = {
  [DEFAULT_WORKSPACE]: {
    name: 'Default workspace',
    scope: UiSettingScope.USER,
    value: null,
    type: 'string',
    schema: schema.nullable(schema.string()),
  },
  [ESSENTIAL_WORKSPACE_DISMISS_GET_STARTED]: {
    value: false,
    description: i18n.translate(
      'workspace.ui_settings.essentialOverview.dismissGetStarted.description',
      {
        defaultMessage: 'Dismiss get started section on essential overview page',
      }
    ),
    scope: UiSettingScope.USER,
    schema: schema.boolean(),
  },
  [ANALYTICS_WORKSPACE_DISMISS_GET_STARTED]: {
    value: false,
    description: i18n.translate(
      'workspace.ui_settings.analyticsOverview.dismissGetStarted.description',
      {
        defaultMessage: 'Dismiss get started section on analytics overview page',
      }
    ),
    scope: UiSettingScope.USER,
    schema: schema.boolean(),
  },
  defaultDataSource: {
    name: i18n.translate('workspace.ui_settings.defaultDataSourceTitle', {
      defaultMessage: 'Default Data Source',
    }),
    value: null,
    type: 'string',
    description: i18n.translate('workspace.ui_settings.defaultDataSource', {
      defaultMessage: 'The data source to access if no data source is set',
    }),
    schema: schema.nullable(schema.string()),
    scope: [UiSettingScope.WORKSPACE, UiSettingScope.GLOBAL],
  },
};
