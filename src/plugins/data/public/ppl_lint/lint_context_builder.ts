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
  title?: string;
  type?: string;
  dataSource?: { id?: string; version?: string; engineType?: string; type?: string };
}

/**
 * Host-maintained cache of the index-pattern field metadata for the active
 * dataset, used by field- and type-aware lint rules. The host refreshes it on
 * dataset change (see the loadFields effect in query_editor /
 * use_query_panel_editor) and stamps the dataset id, data source id, and dataset
 * type it belongs to, so a stale cache from a previous source is never applied
 * to the current one.
 */
export interface LintFieldsCache {
  datasetId?: string;
  dataSourceId?: string;
  datasetType?: string;
  /** The source pattern (index/title) the metadata was loaded for. */
  selectedSourcePattern?: string;
  fields?: Set<string>;
  /** Field name → its single unambiguous OpenSearch type, when one exists. */
  typeMap?: Map<string, string>;
}

/** Minimal index-pattern field shape the metadata extraction reads. */
interface IndexPatternLike {
  fields?: Array<{ name?: string; esTypes?: string[] } | undefined>;
}

/**
 * Collect the non-empty field names from an index pattern into a set, for the
 * field-validation lint context. Shared by the data and explore loadFields
 * effects so both extract names the same way.
 */
export function extractFieldNames(indexPattern: IndexPatternLike): Set<string> {
  return extractFieldMetadata(indexPattern).fields;
}

/**
 * Extract both the field-name set and a name→type map from an index pattern.
 *
 * A field can appear more than once across a data view (e.g. multi-field
 * mappings surface `text` and `keyword` under related names, and merged index
 * patterns can carry conflicting types). The type map keeps a field only when
 * every entry for that name agrees on one `esType`; a field with conflicting
 * types is omitted from the map (but still present in `fields`), so a type-aware
 * rule self-suppresses on it rather than acting on an arbitrary type.
 */
export function extractFieldMetadata(
  indexPattern: IndexPatternLike
): { fields: Set<string>; typeMap: Map<string, string> } {
  const fields = new Set<string>();
  // Track the distinct types seen per name; collapse to one only if unambiguous.
  const seenTypes = new Map<string, Set<string>>();

  for (const field of indexPattern.fields ?? []) {
    if (!field?.name) {
      continue;
    }
    fields.add(field.name);
    const esType = field.esTypes?.[0];
    if (esType) {
      const set = seenTypes.get(field.name) ?? new Set<string>();
      set.add(esType);
      seenTypes.set(field.name, set);
    }
  }

  const typeMap = new Map<string, string>();
  for (const [name, types] of seenTypes) {
    if (types.size === 1) {
      typeMap.set(name, [...types][0]);
    }
  }

  return { fields, typeMap };
}

/** Build the {@link PPLLintContext} for the active dataset and per-rule overrides. */
export function buildPPLLintContext(
  dataset: LintContextDataset | undefined,
  lintFields: LintFieldsCache,
  services: { uiSettings: IUiSettingsClient; http: HttpSetup }
): PPLLintContext {
  const dsId = dataset?.dataSource?.id;
  const dsVersion = dataset?.dataSource?.version;
  const engineType = dataset?.dataSource?.engineType ?? dataset?.dataSource?.type;

  // Fallback to the grammar cache's resolved version when the dataset metadata
  // does not carry a version (common on local-cluster datasets).
  const effectiveVersion = dsVersion || pplGrammarCache.getResolvedVersion(dsId);

  const cachedSettings = calciteSettingsCache.getCached(dsId);

  // Only apply cached metadata when it belongs to the active dataset AND data
  // source AND dataset type; otherwise leave it undefined so field/type/source
  // rules self-suppress (no false results from a stale source). The dataset type
  // is part of the identity so a dataset id reused across types cannot match.
  const cacheMatchesDataset =
    lintFields.datasetId === dataset?.id &&
    lintFields.dataSourceId === dsId &&
    lintFields.datasetType === dataset?.type;

  // Authoritative Calcite classification: prefer the cluster settings the
  // backend reported; fall back to the version heuristic only when settings are
  // not cached yet. `deriveIsCalcite` alone cannot see an administratively
  // disabled Calcite on a >= 3.3 cluster, so the cached value wins when present.
  const isCalcite = cachedSettings ? cachedSettings.calciteEnabled : deriveIsCalcite(effectiveVersion);

  return {
    useRuntimeGrammar: shouldUseRuntimeGrammar(dsId, effectiveVersion, engineType),
    dataSourceId: dsId,
    dataSourceVersion: effectiveVersion,
    engineType,
    isCalcite,
    fields: cacheMatchesDataset ? lintFields.fields : undefined,
    typeMap: cacheMatchesDataset ? lintFields.typeMap : undefined,
    // Expose the selected source pattern only when provenance holds, so a rule
    // can trust it identifies this exact source.
    selectedSourcePattern: cacheMatchesDataset ? lintFields.selectedSourcePattern : undefined,
    settings: cachedSettings
      ? { allJoinTypesAllowed: cachedSettings.allJoinTypesAllowed }
      : undefined,
    overrides: buildOverridesFromSettings(services.uiSettings),
    commandSuggestionEnabled: isCommandSuggestionEnabled(services.uiSettings),
    http: services.http,
  };
}
