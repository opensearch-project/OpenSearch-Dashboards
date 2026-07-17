/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// NOTE: import the engine type as a TYPE only. `DataSourceEngineType` is an enum (a runtime value),
// and `data/common` is re-bundled into consumer plugins via `extraPublicDirs`; a runtime value-import
// across that boundary resolves to `undefined` at load time and breaks this module. The enum's string
// values (`'Elasticsearch'`, `'OpenSearch'`) are used directly as keys instead.
import type { DataSourceEngineType } from '../../data_source/common/data_sources';

/** String values of {@link DataSourceEngineType} used as keys here (kept in sync with the enum). */
const ENGINE = {
  Elasticsearch: 'Elasticsearch' as DataSourceEngineType.Elasticsearch,
  OpenSearch: 'OpenSearch' as DataSourceEngineType.OpenSearch,
};

/**
 * Action-name endpoints (as registered on the enhancements client in
 * `query_enhancements/server/utils/plugins.ts`) used by the server `Facet` to run SQL/PPL for a
 * given engine. These are client-action names, NOT URL paths — the `/_plugins/_*` vs
 * `/_opendistro/_*` URL mapping lives in `query_enhancements/common/constants.ts`.
 */
export interface SqlPplEndpointActions {
  ppl: string;
  sql: string;
}

/**
 * Which language to use for autocomplete column-value suggestions (the `top N column` query).
 * - `'PPL'`: uses `source = <table> | top <n> <column>` (OpenSearch default).
 * - `'SQL'`: uses `SELECT <column> FROM <table> GROUP BY <column> ORDER BY COUNT(*) DESC LIMIT <n>`.
 * - `'none'`: column-value suggestions are disabled for this engine (e.g. engine too old).
 */
export type ColumnValueSuggestionLanguage = 'PPL' | 'SQL' | 'none';

/**
 * Comprehensive, declarative description of what a data-source engine supports. Centralizes the
 * per-engine behavior that used to be scattered as inline `=== 'Elasticsearch'` checks, so adding
 * support for another engine means filling in one entry with full context.
 *
 * Engines without an explicit entry fall through to {@link DEFAULT_ENGINE_CAPABILITIES}, which
 * mirrors the historical OpenSearch behavior (fail-open): consumers therefore stay unchanged for
 * OpenSearch, Serverless, AnalyticEngine, cross-cluster, and unknown engines.
 */
export interface DataSourceEngineCapabilities {
  /**
   * Minimum data-source version (semver) at which each language is supported on this engine.
   * Absent => no per-version gating for that engine.
   */
  minLanguageVersions?: { SQL?: string; PPL?: string };
  /** SQL/PPL live under the Open Distro endpoints (`/_opendistro/_*`) instead of `/_plugins/_*`. */
  usesOpenDistroSqlPpl: boolean;
  /** Whether `stats ... by span(<field>, <interval>)` time-bucketing is supported in PPL. */
  supportsPplSpan: boolean;
  /** Whether the backend runtime PPL grammar endpoint (`/_plugins/_ppl/_grammar`) exists. */
  supportsRuntimePplGrammar: boolean;
  /** Client-action endpoints the server Facet should use to run PPL/SQL for this engine. */
  sqlPplEndpoints: SqlPplEndpointActions;
  /** Which language the autocomplete column-value fetcher should use for this engine. */
  columnValueSuggestionLanguage: ColumnValueSuggestionLanguage;
}

/** Default capabilities (historical OpenSearch behavior) for engines without an explicit entry. */
export const DEFAULT_ENGINE_CAPABILITIES: DataSourceEngineCapabilities = {
  usesOpenDistroSqlPpl: false,
  supportsPplSpan: true,
  supportsRuntimePplGrammar: true,
  sqlPplEndpoints: { ppl: 'enhancements.pplQuery', sql: 'enhancements.sqlQuery' },
  columnValueSuggestionLanguage: 'PPL',
};

/**
 * Explicit per-engine capabilities. Only engines that diverge from the default are listed; all
 * others resolve to {@link DEFAULT_ENGINE_CAPABILITIES}.
 */
const ENGINE_CAPABILITIES: Partial<Record<string, DataSourceEngineCapabilities>> = {
  // Legacy Elasticsearch: SQL/PPL live under Open Distro, no span() in the PPL grammar, no runtime
  // grammar endpoint. Per the "features by engine version" matrix, SQL needs ES >= 6.5 and PPL
  // needs ES >= 7.9.
  [ENGINE.Elasticsearch]: {
    minLanguageVersions: { SQL: '6.5.0', PPL: '7.9.0' },
    usesOpenDistroSqlPpl: true,
    supportsPplSpan: false,
    supportsRuntimePplGrammar: false,
    sqlPplEndpoints: {
      ppl: 'enhancements.pplQueryOpenDistro',
      sql: 'enhancements.sqlQueryOpenDistro',
    },
    columnValueSuggestionLanguage: 'SQL',
  },
  [ENGINE.OpenSearch]: { ...DEFAULT_ENGINE_CAPABILITIES },
};

/**
 * Returns the capabilities for the given engine type, falling back to
 * {@link DEFAULT_ENGINE_CAPABILITIES} for unmapped/unknown/undefined engines (fail-open).
 *
 * @param engineType the data source engine type, typically `dataSource.engineType ?? dataSource.type`.
 */
export const getDataSourceEngineCapabilities = (
  engineType?: string
): DataSourceEngineCapabilities => {
  return ENGINE_CAPABILITIES[engineType ?? ''] ?? DEFAULT_ENGINE_CAPABILITIES;
};
