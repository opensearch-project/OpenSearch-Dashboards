/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { UiSettingsParams } from 'opensearch-dashboards/server';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
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

/** Build per-rule uiSettings keys. Adds WORKSPACE scope when the workspace feature is on. */
export function getPplLintRuleSettings(
  workspaceEnabled: boolean
): Record<string, UiSettingsParams<unknown>> {
  const scope = workspaceEnabled
    ? [UiSettingScope.USER, UiSettingScope.WORKSPACE, UiSettingScope.GLOBAL]
    : [UiSettingScope.USER, UiSettingScope.GLOBAL];

  return Object.fromEntries(
    PPL_LINT_RULE_DEFAULTS.map((rule) => [
      `${UI_SETTINGS.QUERY_ENHANCEMENTS_PPL_LINT_RULE_PREFIX}${rule.id}`,
      {
        name: `PPL linter rule: ${rule.id}`,
        value: { enabled: rule.enabled, severity: rule.severity },
        description: `Enable/disable and set the severity for the "${rule.id}" PPL lint rule.`,
        category: ['search'],
        scope,
        schema: schema.object({
          enabled: schema.boolean(),
          severity: schema.oneOf([
            schema.literal('error'),
            schema.literal('warning'),
            schema.literal('info'),
          ]),
        }),
      },
    ])
  );
}
