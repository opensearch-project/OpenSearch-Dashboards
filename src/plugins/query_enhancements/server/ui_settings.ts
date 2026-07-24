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
  // Tree-walking lint rules carry a severity. The command-typo suggestion is a
  // syntax-channel UX toggle (rewrites a syntax error into "Did you mean ...?"),
  // so it has no configurable severity — it always rides the syntax error's own.
  severity?: 'error' | 'warning' | 'info';
}> = [
  { id: 'head-without-sort', enabled: true, severity: 'info' },
  { id: 'division-by-zero', enabled: true, severity: 'warning' },
  { id: 'unsupported-window-function-in-eventstats', enabled: true, severity: 'error' },
  { id: 'multisearch-min-subsearch', enabled: true, severity: 'error' },
  { id: 'disabled-join-type', enabled: true, severity: 'warning' },
  { id: 'dedup-consecutive-unsupported', enabled: true, severity: 'warning' },
  { id: 'union-min-datasets', enabled: true, severity: 'error' },
  { id: 'replace-wildcard-asymmetry', enabled: true, severity: 'error' },
  { id: 'field-validation', enabled: true, severity: 'error' },
  { id: 'agg-on-text', enabled: true, severity: 'warning' },
  { id: 'flat-object-subfield', enabled: true, severity: 'error' },
  { id: 'type-mismatch-numeric', enabled: true, severity: 'warning' },
  { id: 'command-suggestion', enabled: true },
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
        'and an optional "severity" (error, warning, or info). The "command-suggestion" ' +
        'entry toggles the command-typo "Did you mean ...?" hint and takes no severity.',
      category: ['search'],
      scope,
      schema: schema.arrayOf(
        schema.object({
          id: schema.string(),
          enabled: schema.boolean(),
          // Optional: the command-suggestion toggle carries no severity.
          severity: schema.maybe(
            schema.oneOf([
              schema.literal('error'),
              schema.literal('warning'),
              schema.literal('info'),
            ])
          ),
        })
      ),
    },
  };
}
