/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { BundleRuleOverrides, CatalogEntry, getBundledCatalog, LintSeverity } from '@osd/monaco';
import { UI_SETTINGS } from '../../common';

const SEV_RANK: Record<LintSeverity, number> = { info: 0, warning: 1, error: 2 };

/** Own-property test (not `in`) so inherited names like `toString` are rejected. */
function isLintSeverity(value: string): value is LintSeverity {
  return Object.prototype.hasOwnProperty.call(SEV_RANK, value);
}

/** Per-rule severity floors. Users may disable these but may not downgrade below the floor. */
const MIN_SEVERITY: Record<string, LintSeverity> = {
  'division-by-zero': 'warning',
  'agg-on-text': 'warning',
  'type-mismatch-numeric': 'warning',
};

interface StoredRule {
  id: string;
  enabled?: boolean;
  severity?: LintSeverity;
}

/**
 * Build a {@link BundleRuleOverrides} from the PPL lint rules uiSetting.
 * Only emits fields that differ from catalog defaults; severity is clamped to MIN_SEVERITY.
 */
export function buildOverridesFromSettings(uiSettings: IUiSettingsClient): BundleRuleOverrides {
  const overrides: BundleRuleOverrides = {};

  const stored = uiSettings.get<StoredRule[] | undefined>(
    UI_SETTINGS.QUERY_ENHANCEMENTS_PPL_LINT_RULES,
    undefined
  );
  if (!Array.isArray(stored)) {
    return overrides;
  }

  const storedById = new Map(stored.filter((r) => r && r.id).map((r) => [r.id, r]));

  for (const entry of getBundledCatalog()) {
    const rule = storedById.get(entry.id);
    if (!rule) {
      continue;
    }

    const patch: Partial<CatalogEntry> = {};

    if (typeof rule.enabled === 'boolean' && rule.enabled !== entry.enabled) {
      patch.enabled = rule.enabled;
    }

    // Ignore severities that aren't real levels (reachable via the raw uiSettings
    // API): an unknown value makes SEV_RANK[...] undefined, so the floor comparison
    // is false and the junk value would slip past the MIN_SEVERITY clamp.
    if (rule.severity && isLintSeverity(rule.severity)) {
      const floor = MIN_SEVERITY[entry.id];
      const effective = floor && SEV_RANK[rule.severity] < SEV_RANK[floor] ? floor : rule.severity;
      if (effective !== entry.severity) {
        patch.severity = effective;
      }
    }

    if (Object.keys(patch).length > 0) {
      overrides[entry.id] = patch;
    }
  }

  return overrides;
}

/**
 * The id under which the command-typo suggestion is toggled in the PPL lint
 * rules uiSetting. It is not a tree-walking lint catalog rule (it rewrites a
 * syntax error), so it is read separately from {@link buildOverridesFromSettings}
 * rather than iterated over the catalog.
 */
export const COMMAND_SUGGESTION_RULE_ID = 'command-suggestion';

/**
 * Read whether the command-typo suggestion is enabled from the PPL lint rules
 * uiSetting. Defaults to `true` when the entry is absent or the setting is unset,
 * preserving the pre-toggle behavior; only an explicit `enabled: false` turns it off.
 */
export function isCommandSuggestionEnabled(uiSettings: IUiSettingsClient): boolean {
  const stored = uiSettings.get<StoredRule[] | undefined>(
    UI_SETTINGS.QUERY_ENHANCEMENTS_PPL_LINT_RULES,
    undefined
  );
  if (!Array.isArray(stored)) {
    return true;
  }
  const entry = stored.find((r) => r && r.id === COMMAND_SUGGESTION_RULE_ID);
  return entry?.enabled !== false;
}
