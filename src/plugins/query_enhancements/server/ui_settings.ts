/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { UiSettingsParams } from 'opensearch-dashboards/server';
import { UiSettingScope } from '../../../core/server/ui_settings/types';
import { UI_SETTINGS } from '../../data/common';

const PPL_LINT_RULE_DEFAULTS: ReadonlyArray<{
  id: string;
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
}> = [
  { id: 'head-without-sort', enabled: true, severity: 'info' },
  { id: 'division-by-zero', enabled: true, severity: 'warning' },
];

/** Build PPL lint rule uiSettings. Adds WORKSPACE scope when the workspace feature is on. */
export function getPplLintRuleSettings(
  workspaceEnabled: boolean
): Record<string, UiSettingsParams<unknown>> {
  const scope = workspaceEnabled
    ? [UiSettingScope.USER, UiSettingScope.WORKSPACE, UiSettingScope.GLOBAL]
    : [UiSettingScope.USER, UiSettingScope.GLOBAL];

  return {
    [UI_SETTINGS.QUERY_ENHANCEMENTS_PPL_LINT_RULES]: {
      name: 'PPL lint rules',
      value: JSON.stringify(PPL_LINT_RULE_DEFAULTS, null, 2),
      type: 'json',
      description:
        'Configure PPL lint rules. Each entry has "id" (rule name), "enabled" (true/false), ' +
        'and "severity" (error, warning, or info).',
      category: ['search'],
      scope,
      schema: schema.arrayOf(
        schema.object({
          id: schema.string(),
          enabled: schema.boolean(),
          severity: schema.oneOf([
            schema.literal('error'),
            schema.literal('warning'),
            schema.literal('info'),
          ]),
        })
      ),
    },
  };
}
