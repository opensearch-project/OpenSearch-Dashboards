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
import { buildOverridesFromSettings, isCommandSuggestionEnabled } from './lint_overrides';
import { calciteSettingsCache } from './calcite_settings_cache';

/** Subset of dataset fields needed for lint context construction. */
interface LintContextDataset {
  id?: string;
  dataSource?: { id?: string; version?: string; engineType?: string; type?: string };
}

/**
 * Host-maintained cache of the index-pattern field names for the active
 * dataset, used by field-validation. The host refreshes it on dataset change
 * (see the loadFields effect in query_editor / use_query_panel_editor) and
 * stamps the dataset + data source ids it belongs to, so a stale cache from a
 * previous dataset or data source is never applied to the current one.
 */
export interface LintFieldsCache {
  datasetId?: string;
  dataSourceId?: string;
  fields?: Set<string>;
  typeMap?: Map<string, string>;
}

/**
 * Collect the non-empty field names from an index pattern into a set, for the
 * field-validation lint context. Shared by the data and explore loadFields
 * effects so both extract names the same way.
 */
export function extractFieldNames(indexPattern: {
  fields?: Array<{ name?: string } | undefined>;
}): Set<string> {
  const fields = new Set<string>();
  for (const field of indexPattern.fields ?? []) {
    if (field?.name) {
      fields.add(field.name);
    }
  }
  return fields;
}

/**
 * Derive an unambiguous field-name → esType map from an index pattern, for the
 * type-aware lint rules (agg-on-text, expand-on-non-array, flat-object-subfield,
 * type-mismatch-numeric). Runs in the same effect that already loads the index
 * pattern, so it adds no request.
 *
 * A wildcard data view can back a single field name with conflicting mappings
 * across indices (`['long', 'keyword']`), so this aggregates every entry for a
 * name first and only keeps the field when exactly one unique non-empty type
 * remains. Ambiguous or empty mappings are omitted, so a type-aware rule sees no
 * entry and self-suppresses rather than guessing. Dotted names are preserved
 * exactly; query references are canonicalized through `parseFieldPath` at lookup.
 */
export function extractFieldTypeMap(indexPattern: {
  fields?: Array<{ name?: string; esTypes?: string[] } | undefined>;
}): Map<string, string> {
  const typesByName = new Map<string, Set<string>>();
  for (const field of indexPattern.fields ?? []) {
    if (!field?.name) {
      continue;
    }
    let types = typesByName.get(field.name);
    if (!types) {
      types = new Set<string>();
      typesByName.set(field.name, types);
    }
    for (const type of field.esTypes ?? []) {
      if (type) {
        types.add(type);
      }
    }
  }

  const result = new Map<string, string>();
  for (const [name, types] of typesByName) {
    if (types.size === 1) {
      result.set(name, [...types][0]);
    }
  }
  return result;
}

/** Build the {@link PPLLintContext} for the active dataset and per-rule overrides. */
export function buildPPLLintContext(
  dataset: LintContextDataset | undefined,
  lintFields: LintFieldsCache,
  services: { uiSettings: IUiSettingsClient; http: HttpSetup }
): PPLLintContext {
  const dsId = dataset?.dataSource?.id;
  const dsVersion = dataset?.dataSource?.version;
  const dsEngineType = dataset?.dataSource?.engineType ?? dataset?.dataSource?.type;

  // Fallback to the grammar cache's resolved version when the dataset metadata
  // does not carry a version (common on local-cluster datasets).
  const effectiveVersion = dsVersion || pplGrammarCache.getResolvedVersion(dsId);

  const cachedSettings = calciteSettingsCache.getCached(dsId);

  // Only apply cached fields when they belong to the active dataset AND data
  // source; otherwise leave them undefined so field-validation self-suppresses
  // (no false unknowns from a stale source).
  const cacheMatchesDataset =
    lintFields.datasetId === dataset?.id && lintFields.dataSourceId === dsId;

  // Prefer the cluster's actual Calcite setting when the settings fetch has
  // resolved: `deriveIsCalcite` only reads the semver (>= 3.3.0), which cannot
  // detect an administratively-disabled Calcite on a new-enough cluster. Fall
  // back to the version heuristic until the cache warms up.
  const isCalcite =
    cachedSettings !== undefined
      ? cachedSettings.calciteEnabled
      : deriveIsCalcite(effectiveVersion);

  return {
    useRuntimeGrammar: shouldUseRuntimeGrammar(dsId, effectiveVersion, dsEngineType),
    dataSourceId: dsId,
    dataSourceVersion: effectiveVersion,
    isCalcite,
    fields: cacheMatchesDataset ? lintFields.fields : undefined,
    typeMap: cacheMatchesDataset ? lintFields.typeMap : undefined,
    settings: cachedSettings
      ? { allJoinTypesAllowed: cachedSettings.allJoinTypesAllowed }
      : undefined,
    overrides: buildOverridesFromSettings(services.uiSettings),
    commandSuggestionEnabled: isCommandSuggestionEnabled(services.uiSettings),
    http: services.http,
  };
}
