/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { BundleRuleOverrides, CatalogEntry, getBundledCatalog, LintSeverity } from '@osd/monaco';
import { UI_SETTINGS } from '../../common';

const SEV_RANK: Record<LintSeverity, number> = { info: 0, warning: 1, error: 2 };

/** Per-rule severity floors. Users may disable these but may not downgrade below the floor. */
const MIN_SEVERITY: Record<string, LintSeverity> = {
  'division-by-zero': 'warning',
};

interface StoredRule {
  id: string;
  enabled?: boolean;
  severity?: LintSeverity;
}

/**
 * Read the PPL lint rules uiSetting into a {@link BundleRuleOverrides} map the
 * lint engine merges over the bundled catalog.
 *
 * Sparse by design: a field is emitted only when it actually differs from the
 * bundled default, so an unchanged rule contributes nothing and the engine
 * keeps using the catalog entry verbatim. Severity is clamped up to the
 * silent-failure floor before being emitted.
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

    if (rule.severity) {
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
