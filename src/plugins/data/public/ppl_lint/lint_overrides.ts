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

interface StoredRuleSetting {
  enabled?: boolean;
  severity?: LintSeverity;
}

/**
 * Read the per-rule lint uiSettings into a {@link BundleRuleOverrides} map the
 * lint engine merges over the bundled catalog.
 *
 * Sparse by design: a field is emitted only when it actually differs from the
 * bundled default, so an unchanged rule contributes nothing and the engine
 * keeps using the catalog entry verbatim. Severity is clamped up to the
 * silent-failure floor before being emitted.
 */
export function buildOverridesFromSettings(uiSettings: IUiSettingsClient): BundleRuleOverrides {
  const overrides: BundleRuleOverrides = {};

  for (const entry of getBundledCatalog()) {
    const key = `${UI_SETTINGS.QUERY_ENHANCEMENTS_PPL_LINT_RULE_PREFIX}${entry.id}`;
    const stored = uiSettings.get<StoredRuleSetting | undefined>(key, undefined);
    if (!stored || typeof stored !== 'object') {
      continue;
    }

    const patch: Partial<CatalogEntry> = {};

    if (typeof stored.enabled === 'boolean' && stored.enabled !== entry.enabled) {
      patch.enabled = stored.enabled;
    }

    if (stored.severity) {
      const floor = MIN_SEVERITY[entry.id];
      const effective =
        floor && SEV_RANK[stored.severity] < SEV_RANK[floor] ? floor : stored.severity;
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
