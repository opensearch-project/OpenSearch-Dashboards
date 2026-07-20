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
  { id: 'invalid-capture-group-name', enabled: true, severity: 'error' },
  { id: 'operation-not-pushed', enabled: true, severity: 'warning' },
  { id: 'operation-pushed-as-script', enabled: true, severity: 'info' },
  { id: 'command-suggestion', enabled: true },
];

// How the explain-backed performance rules resolve a whole-query finding to the
// offending command when several candidates share the flagged operation.
// "thorough" (the default) fires bounded control/treatment `_explain` probes to
// pin the culprit; "fast" narrows only when exactly one candidate matches and
// drops ambiguous findings, issuing no extra network. A global behavior, so it
// sits beside the rule list rather than on each rule.
const PPL_LINT_DEFAULTS = {
  mode: 'thorough' as const,
  rules: PPL_LINT_RULE_DEFAULTS,
};

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
      value: JSON.stringify(PPL_LINT_DEFAULTS, null, 2),
      type: 'json',
      description:
        'Configure PPL lint rules. "rules" is a list where each entry has "id" (rule name), ' +
        '"enabled" (true/false), and an optional "severity" (error, warning, or info); the ' +
        '"command-suggestion" entry toggles the command-typo "Did you mean ...?" hint and takes ' +
        'no severity. "mode" controls how the performance rules pinpoint a slow command: ' +
        '"thorough" (default) runs extra explain probes to isolate the exact command, while ' +
        '"fast" skips those probes and only flags a command when it can be identified without them.',
      category: ['search'],
      scope,
      schema: schema.object({
        mode: schema.oneOf([schema.literal('fast'), schema.literal('thorough')], {
          defaultValue: 'thorough',
        }),
        rules: schema.arrayOf(
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
      }),
    },
  };
}
