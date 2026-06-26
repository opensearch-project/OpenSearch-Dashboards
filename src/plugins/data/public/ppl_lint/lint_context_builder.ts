/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { PPLLintContext } from '@osd/monaco';
import { HttpSetup } from '../../../../core/public';
import {
  deriveIsCalcite,
  pplGrammarCache,
  shouldUseRuntimeGrammar,
} from '../antlr/opensearch_ppl/ppl_grammar_cache';
import { buildOverridesFromSettings } from './lint_overrides';
import { calciteSettingsCache } from './calcite_settings_cache';

/** Subset of dataset fields needed for lint context construction. */
interface LintContextDataset {
  id?: string;
  dataSource?: { id?: string; version?: string };
}

/**
 * Host-maintained cache of the index-pattern field names for the active
 * dataset, used by field-validation. The host refreshes it on dataset change
 * (see the loadFields effect in query_editor / use_query_panel_editor) and
 * stamps the dataset id it belongs to, so a stale cache from a previous dataset
 * is never applied to the current one.
 */
export interface LintFieldsCache {
  datasetId?: string;
  fields?: Set<string>;
}

/** Build the {@link PPLLintContext} for the active dataset and per-rule overrides. */
export function buildPPLLintContext(
  dataset: LintContextDataset | undefined,
  lintFields: LintFieldsCache,
  services: { uiSettings: IUiSettingsClient; http: HttpSetup }
): PPLLintContext {
  const dsId = dataset?.dataSource?.id;
  const dsVersion = dataset?.dataSource?.version;

  // Fallback to the grammar cache's resolved version when the dataset metadata
  // does not carry a version (common on local-cluster datasets).
  const effectiveVersion = dsVersion || pplGrammarCache.getResolvedVersion(dsId);

  const cachedSettings = calciteSettingsCache.getCached(dsId);

  // Only apply cached fields when they belong to the active dataset; otherwise
  // leave them undefined so field-validation self-suppresses (no false unknowns).
  const cacheMatchesDataset = lintFields.datasetId === dataset?.id;

  return {
    useRuntimeGrammar: shouldUseRuntimeGrammar(dsId, effectiveVersion),
    dataSourceId: dsId,
    dataSourceVersion: effectiveVersion,
    isCalcite: deriveIsCalcite(effectiveVersion),
    fields: cacheMatchesDataset ? lintFields.fields : undefined,
    settings: cachedSettings
      ? { allJoinTypesAllowed: cachedSettings.allJoinTypesAllowed }
      : undefined,
    overrides: buildOverridesFromSettings(services.uiSettings),
    http: services.http,
  };
}
