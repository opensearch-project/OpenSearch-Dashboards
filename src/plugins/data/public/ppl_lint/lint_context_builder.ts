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
 * Host-maintained cache of the active dataset's field metadata, stamped with
 * dataset/data-source/type identity so a stale cache is never applied here.
 */
export interface LintFieldsCache {
  datasetId?: string;
  dataSourceId?: string;
  datasetType?: string;
  selectedSourcePattern?: string;
  fields?: Set<string>;
  typeMap?: Map<string, string>;
}

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
 * Extract the field-name set plus a name→type map. A name with conflicting
 * `esTypes` is omitted from the map (kept in `fields`) so type-aware rules
 * self-suppress rather than act on an arbitrary type.
 */
export function extractFieldMetadata(indexPattern: IndexPatternLike): {
  fields: Set<string>;
  typeMap: Map<string, string>;
} {
  const fields = new Set<string>();
  const seenTypes = new Map<string, Set<string>>();

  for (const field of indexPattern.fields ?? []) {
    if (!field?.name) {
      continue;
    }
    fields.add(field.name);
    const set = seenTypes.get(field.name) ?? new Set<string>();
    for (const esType of field.esTypes ?? []) {
      if (esType) {
        set.add(esType);
      }
    }
    seenTypes.set(field.name, set);
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

  // Apply cached metadata only when dataset id, data source, and type all match;
  // otherwise leave it undefined so field/type/source rules self-suppress.
  const cacheMatchesDataset =
    lintFields.datasetId === dataset?.id &&
    lintFields.dataSourceId === dsId &&
    lintFields.datasetType === dataset?.type;

  // Prefer backend-reported settings; the version heuristic can't see an
  // admin-disabled Calcite on a >= 3.3 cluster, so cached settings win.
  const isCalcite = cachedSettings
    ? cachedSettings.calciteEnabled
    : deriveIsCalcite(effectiveVersion);

  return {
    useRuntimeGrammar: shouldUseRuntimeGrammar(dsId, effectiveVersion, engineType),
    dataSourceId: dsId,
    dataSourceVersion: effectiveVersion,
    engineType,
    isCalcite,
    fields: cacheMatchesDataset ? lintFields.fields : undefined,
    typeMap: cacheMatchesDataset ? lintFields.typeMap : undefined,
    selectedSourcePattern: cacheMatchesDataset ? lintFields.selectedSourcePattern : undefined,
    settings: cachedSettings
      ? { allJoinTypesAllowed: cachedSettings.allJoinTypesAllowed }
      : undefined,
    overrides: buildOverridesFromSettings(services.uiSettings),
    commandSuggestionEnabled: isCommandSuggestionEnabled(services.uiSettings),
    http: services.http,
  };
}
