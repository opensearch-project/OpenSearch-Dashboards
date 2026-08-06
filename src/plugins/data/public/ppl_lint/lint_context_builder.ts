/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { PPLLintContext } from '@osd/monaco';
import { ENABLE_AI_FEATURES, HttpSetup } from '../../../../core/public';
import {
  deriveIsCalcite,
  pplGrammarCache,
  shouldUseRuntimeGrammar,
} from '../antlr/opensearch_ppl/ppl_grammar_cache';
import {
  buildOverridesFromSettings,
  isCommandSuggestionEnabled,
  readExplainMode,
} from './lint_overrides';
import { calciteSettingsCache } from './calcite_settings_cache';
import { explainQueryPreparer } from './explain_query_preparer';

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
  /** Object fields mapped `enabled:false`; absent from `_field_caps`. */
  disabledObjectFields?: Set<string>;
  /** Index/alias/data-stream names visible to the user, for wildcard checks. */
  visibleIndices?: string[];
  /**
   * Whether the AI lint-fix agent is reachable for this dataset's data source,
   * resolved asynchronously alongside the field metadata. Undefined until the
   * probe resolves, which leaves the AI quick-fix shown (fail-open).
   */
  aiAgentAvailableForSource?: boolean;
}

/** The host-supplied AI chat-fix hooks, absent when chat is not wired. */
type PPLLintAiFixHooks = Pick<PPLLintContext, 'onAskAiFix' | 'aiFixToolName'>;

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
  services: { uiSettings: IUiSettingsClient; http: HttpSetup },
  aiFix?: PPLLintAiFixHooks
): PPLLintContext {
  const dsId = dataset?.dataSource?.id;
  const dsVersion = dataset?.dataSource?.version;
  // Engine identity for capability lookups. Matches the sibling validation-context
  // builders (query_editor / use_query_panel_editor), which use `engineType ?? type`.
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
  const cacheMatchesDataSource = lintFields.dataSourceId === dsId;

  // Only a reading the route actually took counts. The route fails open, so a
  // cached response from a failed read still says `calciteEnabled: true` — using
  // it would let Calcite-only rules fire against an unreachable or 403 cluster.
  // Leaving this undefined keeps those rules quiet until a real reading arrives,
  // and the settings cache re-lints both hosts when one does.
  const measuredCalciteEnabled =
    cachedSettings?.calciteMeasured === true ? cachedSettings.calciteEnabled : undefined;

  const isCalcite = deriveIsCalcite(effectiveVersion, engineType, measuredCalciteEnabled);

  return {
    useRuntimeGrammar: shouldUseRuntimeGrammar(dsId, effectiveVersion, engineType),
    dataSourceId: dsId,
    dataSourceVersion: effectiveVersion,
    engineType,
    isCalcite,
    fields: cacheMatchesDataset ? lintFields.fields : undefined,
    typeMap: cacheMatchesDataset ? lintFields.typeMap : undefined,
    disabledObjectFields: cacheMatchesDataset ? lintFields.disabledObjectFields : undefined,
    selectedSourcePattern: cacheMatchesDataset ? lintFields.selectedSourcePattern : undefined,
    // Cluster-wide rather than dataset-scoped, so it is not gated on the
    // dataset-identity check the field metadata uses. It is still data-source
    // scoped so names from one MDS cluster never leak into another.
    visibleIndices: cacheMatchesDataSource ? lintFields.visibleIndices : undefined,
    settings: cachedSettings
      ? { allJoinTypesAllowed: cachedSettings.allJoinTypesAllowed }
      : undefined,
    overrides: buildOverridesFromSettings(services.uiSettings),
    commandSuggestionEnabled: isCommandSuggestionEnabled(services.uiSettings),
    explainMode: readExplainMode(services.uiSettings),
    http: services.http,
    // Registered by query_enhancements into this shared data/public singleton
    // whenever the runtime-grammar bridge is active. Every host that runs PPL
    // lint (Discover and Explore alike) reads the same singleton, so this is
    // present in Explore too; it is undefined only in the compiled-worker
    // fallback (bridge off), in which case the explain layer explains the raw
    // editor text.
    prepareExplainQuery: explainQueryPreparer.get(),
    // Dataset metadata + AI-feature/chat hooks the "Ask AI to fix" command
    // reads via getPPLLintContext(model). enableAIFeatures hides the action
    // entirely when AI features are off. These ride the runtime bridge path only.
    datasetTitle: dataset?.title,
    enableAIFeatures: Boolean(services.uiSettings.get(ENABLE_AI_FEATURES, true)),
    // Per-source AI reachability rides the same cacheMatchesDataset guard as the
    // field metadata: after a dataset switch the previous source's answer must
    // not apply to the new source, so it is dropped until the new probe resolves
    // (undefined → shown, matching the fail-open contract).
    aiAgentAvailableForSource: cacheMatchesDataset
      ? lintFields.aiAgentAvailableForSource
      : undefined,
    onAskAiFix: aiFix?.onAskAiFix,
    aiFixToolName: aiFix?.aiFixToolName,
  };
}
