/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParserRuleContext } from 'antlr4ng';
import { Diagnostic } from './diagnostic';
import { BundleRuleOverrides, CatalogEntry, LintRunContext } from './types';
import { RuleNameToIndex } from './rule_index';
import { getBundledCatalog } from './catalog';
import { getDetector } from './detector_registry';
import { appliesTo, OSD_KNOWN_VERSION } from './version_filter';

export type { BundleRuleOverrides };

export interface RunLintOptions {
  catalog?: CatalogEntry[];
  bundleOverrides?: BundleRuleOverrides;
  dataSourceVersion?: string;
  ruleNameToIndex: RuleNameToIndex;
  context?: LintRunContext;
  knownVersion?: string;
}

export function mergeConfig(local: CatalogEntry, override?: Partial<CatalogEntry>): CatalogEntry {
  if (!override) {
    return local;
  }
  return {
    ...local,
    ...override,
    appliesTo: { ...local.appliesTo, ...(override.appliesTo ?? {}) },
  };
}

function isContextEmpty(context: LintRunContext | undefined): boolean {
  return (
    (!context?.fields || context.fields.size === 0) &&
    (!context?.visibleIndices || context.visibleIndices.length === 0)
  );
}

export function runLint(tree: ParserRuleContext, options: RunLintOptions): Diagnostic[] {
  const {
    catalog = getBundledCatalog(),
    bundleOverrides,
    dataSourceVersion,
    ruleNameToIndex,
    context,
    knownVersion = OSD_KNOWN_VERSION,
  } = options;

  const diagnostics: Diagnostic[] = [];

  const effectiveOverrides = bundleOverrides ?? context?.overrides;

  for (const localConfig of catalog) {
    const config = mergeConfig(localConfig, effectiveOverrides?.[localConfig.id]);

    if (
      !config.enabled ||
      config.needsExplain ||
      (config.runtimeOnly && context?.grammarSurface !== 'runtime-bundle') ||
      !appliesTo(config, dataSourceVersion, context?.isCalcite, knownVersion) ||
      (config.needsContext && isContextEmpty(context))
    ) {
      continue;
    }

    const detector = getDetector(config.detector);
    if (!detector) {
      // eslint-disable-next-line no-console
      console.warn(`[ppl-lint] inert rule: no detector registered for "${config.id}"`);
      continue;
    }

    try {
      const ruleDiagnostics = detector(tree, config, context ?? {}, ruleNameToIndex);
      diagnostics.push(...ruleDiagnostics);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[ppl-lint] rule "${config.id}" threw and was skipped`, e);
    }
  }

  return diagnostics;
}
