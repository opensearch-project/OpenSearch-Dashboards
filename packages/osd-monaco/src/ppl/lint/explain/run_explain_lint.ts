/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import semver from 'semver';
import { Diagnostic } from '../diagnostic';
import { BundleRuleOverrides, CatalogEntry, LintRunContext } from '../types';
import { getBundledCatalog } from '../catalog';
import { mergeConfig } from '../lint_runner';
import { appliesTo, OSD_KNOWN_VERSION } from '../version_filter';
import { getExplainDetector } from './explain_registry';
import { ExplainPlan } from './explain_types';

function hasParseableDataSourceVersion(dataSourceVersion: string | undefined): boolean {
  return !!dataSourceVersion?.trim() && semver.coerce(dataSourceVersion) !== null;
}

export interface RunExplainLintOptions extends Pick<
  LintRunContext,
  'overrides' | 'dataSourceVersion' | 'isCalcite'
> {
  /** The query text the plan was produced for (sizes the whole-query range). */
  query: string;
  /** The catalog to iterate; defaults to the bundled catalog. */
  catalog?: CatalogEntry[];
  knownVersion?: string;
}

/**
 * True when a catalog entry would actually run as an explain rule for the given
 * source: after override-merge it is explain-tagged, enabled, and version/engine
 * applicable. Shared by `hasExplainRules` (the pre-flight check) and
 * `runExplainLint` (the resolution loop) so the two filter identically.
 */
function isApplicableExplainEntry(
  localConfig: CatalogEntry,
  overrides: BundleRuleOverrides | undefined,
  dataSourceVersion: string | undefined,
  isCalcite: boolean | undefined,
  knownVersion: string
): boolean {
  const config = mergeConfig(localConfig, overrides?.[localConfig.id]);
  return (
    config.needsExplain === true &&
    config.enabled === true &&
    appliesTo(config, dataSourceVersion, isCalcite, knownVersion)
  );
}

/**
 * Resolve the set of explain-backed catalog entries that would actually run for
 * the given source — enabled, version/engine applicable, and explain-tagged. A
 * caller uses this to decide whether to issue the `_explain` network call at
 * all: when it returns false there is no rule to feed, so the round-trip is
 * skipped.
 */
export function hasExplainRules(options: Omit<RunExplainLintOptions, 'query'>): boolean {
  const {
    catalog = getBundledCatalog(),
    overrides,
    dataSourceVersion,
    isCalcite,
    knownVersion = OSD_KNOWN_VERSION,
  } = options;

  if (!hasParseableDataSourceVersion(dataSourceVersion)) {
    return false;
  }

  return catalog.some((localConfig) =>
    isApplicableExplainEntry(localConfig, overrides, dataSourceVersion, isCalcite, knownVersion)
  );
}

/**
 * The explain resolution pass. Iterates the catalog, applies the same override,
 * version, and engine filtering as the tree loop (`runLint`), but only over
 * explain-tagged rules, dispatching each through the explain registry inside
 * per-rule isolation so one failing rule cannot break the rest.
 */
export function runExplainLint(plan: ExplainPlan, options: RunExplainLintOptions): Diagnostic[] {
  const {
    query,
    catalog = getBundledCatalog(),
    overrides,
    dataSourceVersion,
    isCalcite,
    knownVersion = OSD_KNOWN_VERSION,
  } = options;

  if (!hasParseableDataSourceVersion(dataSourceVersion)) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];

  for (const localConfig of catalog) {
    // Explain-tagged, enabled, and version/engine applicable — the same filter
    // `hasExplainRules` uses for its pre-flight check (tree rules ran in
    // `runLint`).
    if (
      !isApplicableExplainEntry(localConfig, overrides, dataSourceVersion, isCalcite, knownVersion)
    ) {
      continue;
    }

    const config = mergeConfig(localConfig, overrides?.[localConfig.id]);
    const detector = getExplainDetector(config.detector);
    if (!detector) {
      // eslint-disable-next-line no-console
      console.warn(`[ppl-lint] inert explain rule: no detector registered for "${config.id}"`);
      continue;
    }

    try {
      diagnostics.push(...detector(plan, config, { query }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[ppl-lint] explain rule "${config.id}" threw and was skipped`, e);
    }
  }

  return diagnostics;
}
