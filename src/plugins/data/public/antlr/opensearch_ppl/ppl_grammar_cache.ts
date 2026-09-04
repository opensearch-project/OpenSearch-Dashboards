/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HttpSetup,
  IUiSettingsClient,
  SavedObjectsClientContract,
} from 'opensearch-dashboards/public';
import semver from 'semver';
import { PPLGrammarBundle } from './ppl_bundle_loader';
import { CachedGrammar, deserializeGrammarBundle } from './ppl_grammar_deserialize';
import { getDataSourceEngineCapabilities, UI_SETTINGS } from '../../../common';

const ARTIFACT_ENDPOINT = '/api/enhancements/ppl/grammar';

// `CachedGrammar` and the bundle-deserialization logic now live in the Node-safe
// `ppl_grammar_deserialize` module so both this browser cache and the headless
// CI lint API share one implementation. Re-exported here to keep existing
// `import { CachedGrammar } from './ppl_grammar_cache'` call sites working.
export type { CachedGrammar } from './ppl_grammar_deserialize';

/**
 * Single-slot in-memory cache for PPL grammar artifacts.
 * Holds at most one grammar at a time (for the currently active datasource).
 * Automatically clears itself when a different datasource is requested.
 */
class PPLGrammarCache {
  /** Retry a failed fetch after 30 seconds. */
  private static readonly RETRY_AFTER_MS = 30_000;

  private grammarUpdateListeners: Set<
    (event: { dataSourceId?: string; grammarHash: string }) => void
  > = new Set();

  private versionResolvedListeners: Set<
    (event: { dataSourceId?: string; version: string }) => void
  > = new Set();

  private cachedDatasourceId: string | undefined;
  private cachedVersion: string | undefined;
  private cachedGrammar: CachedGrammar | null = null;
  private pendingFetch: Promise<CachedGrammar | null> | null = null;
  private fetchFailed = false;
  private fetchFailedAt = 0;

  /**
   * Returns true if version >= 3.6.0 (grammar artifact endpoint support).
   *
   * Engines without a runtime PPL grammar endpoint (e.g. Elasticsearch / Open Distro, whose SQL/PPL
   * live under Open Distro and expose no `/_plugins/_ppl/_grammar`) always fall back to the bundled
   * grammar regardless of version.
   */
  shouldFetchFromBackend(version?: string, engineType?: string): boolean {
    if (!getDataSourceEngineCapabilities(engineType).supportsRuntimePplGrammar) return false;
    if (!version) return false;
    const coerced = semver.coerce(version);
    return coerced ? semver.satisfies(coerced.version, '>=3.6.0') : false;
  }

  getCachedGrammar(datasourceId?: string): CachedGrammar | null {
    if (datasourceId !== this.cachedDatasourceId) return null;
    return this.cachedGrammar;
  }

  /**
   * Returns the resolved version string for the given datasource, or undefined
   * if the version has not been resolved yet. This provides a synchronous fallback
   * for contexts where `dataset.dataSource.version` is unavailable (e.g. local cluster).
   */
  getResolvedVersion(datasourceId?: string): string | undefined {
    if (datasourceId !== this.cachedDatasourceId) return undefined;
    return this.cachedVersion;
  }

  /**
   * Kick off a background grammar fetch for a datasource.
   * If the datasource differs from the cached one, the cache is cleared first.
   * Safe to call repeatedly — deduplicates in-flight requests and skips
   * when the grammar is already cached or a previous fetch failed.
   */
  warmUp(
    http: HttpSetup,
    uiSettings: IUiSettingsClient | undefined,
    savedObjectsClient?: SavedObjectsClientContract,
    datasourceId?: string,
    datasourceVersion?: string,
    datasourceEngineType?: string
  ): void {
    // Check feature flag - if disabled, reset cache state but keep subscribers
    // `?.` covers a missing client; the explicit default covers an undeclared
    // key, which would otherwise throw rather than fall back.
    const runtimeGrammarEnabled =
      uiSettings?.get<boolean>(UI_SETTINGS.QUERY_ENHANCEMENTS_RUNTIME_PPL_GRAMMAR, true) !== false;
    if (!runtimeGrammarEnabled) {
      this.reset();
      return;
    }

    // Datasource changed — reset everything.
    if (datasourceId !== this.cachedDatasourceId) {
      this.reset();
      this.cachedDatasourceId = datasourceId;
    }

    if (datasourceVersion) {
      this.cachedVersion = datasourceVersion;
    }

    // Allow retry after the cooldown period has elapsed.
    if (this.fetchFailed && Date.now() - this.fetchFailedAt >= PPLGrammarCache.RETRY_AFTER_MS) {
      this.fetchFailed = false;
    }

    // Already cached, in-flight, or recently failed — nothing to do.
    if (this.cachedGrammar || this.pendingFetch || this.fetchFailed) return;

    const promise = this.doWarmUp(
      http,
      savedObjectsClient,
      datasourceId,
      datasourceVersion,
      datasourceEngineType
    );
    this.pendingFetch = promise;

    promise
      .catch(() => {
        this.fetchFailed = true;
        this.fetchFailedAt = Date.now();
      })
      .finally(() => {
        if (this.pendingFetch === promise) {
          this.pendingFetch = null;
        }
      });
  }

  /** Reset cache state. Used internally and by tests via `dispose()`. */
  private reset(): void {
    this.cachedDatasourceId = undefined;
    this.cachedVersion = undefined;
    this.cachedGrammar = null;
    this.pendingFetch = null;
    this.fetchFailed = false;
    this.fetchFailedAt = 0;
  }

  /** Reset all cache state AND unregister all listeners. */
  dispose(): void {
    this.reset();
    this.grammarUpdateListeners.clear();
    this.versionResolvedListeners.clear();
  }

  subscribeToGrammarUpdates(
    listener: (event: { dataSourceId?: string; grammarHash: string }) => void
  ): () => void {
    this.grammarUpdateListeners.add(listener);
    return () => {
      this.grammarUpdateListeners.delete(listener);
    };
  }

  subscribeToVersionResolved(
    listener: (event: { dataSourceId?: string; version: string }) => void
  ): () => void {
    this.versionResolvedListeners.add(listener);
    return () => {
      this.versionResolvedListeners.delete(listener);
    };
  }

  private async doWarmUp(
    http: HttpSetup,
    savedObjectsClient: SavedObjectsClientContract | undefined,
    datasourceId?: string,
    datasourceVersion?: string,
    datasourceEngineType?: string
  ): Promise<CachedGrammar | null> {
    const version = await this.resolveVersion(
      http,
      savedObjectsClient,
      datasourceId,
      datasourceVersion
    );
    if (!this.shouldFetchFromBackend(version, datasourceEngineType)) {
      // Version unsupported or unknown — not a failure, just nothing to fetch.
      // Don't set fetchFailed so that future warmUp calls can retry when the
      // version becomes available (e.g. the local cluster version route wasn't
      // ready on page load).
      return null;
    }
    const result = await this.doFetch(http, datasourceId);
    if (!result && datasourceId === this.cachedDatasourceId) {
      // Grammar endpoint was reachable but returned an invalid bundle, or the
      // request itself failed — treat as a real failure to avoid hammering.
      // Only set if datasource hasn't changed while we were fetching.
      // Retries are allowed after RETRY_AFTER_MS elapses.
      this.fetchFailed = true;
      this.fetchFailedAt = Date.now();
    }
    return result;
  }

  private async resolveVersion(
    http: HttpSetup,
    savedObjectsClient: SavedObjectsClientContract | undefined,
    datasourceId?: string,
    datasourceVersion?: string
  ): Promise<string | undefined> {
    if (datasourceVersion) return datasourceVersion;
    if (this.cachedVersion) return this.cachedVersion;

    try {
      let version: string | undefined;
      if (datasourceId && savedObjectsClient) {
        // Remote datasource — read version from the saved object.
        const savedObject = await savedObjectsClient.get('data-source', datasourceId);
        version = (savedObject.attributes as any)?.dataSourceVersion as string | undefined;
      } else if (!datasourceId) {
        // Local cluster — read the cluster engine version (the >=3.6.0 check is
        // cluster-side); runtime HTTP call, not a plugin dep, to avoid a data_source_management cycle.
        const response = await http.get<{ version?: string }>(
          '/internal/data-source-management/localClusterVersion'
        );
        version = response?.version || undefined;
      }
      if (version) {
        this.cachedVersion = version;
        this.notifyVersionResolved(datasourceId, version);
      }
      return version;
    } catch {
      return undefined;
    }
  }

  private async doFetch(http: HttpSetup, datasourceId?: string): Promise<CachedGrammar | null> {
    try {
      const query: Record<string, string> = {};
      if (datasourceId) {
        query.dataSourceId = datasourceId;
      }

      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), 10000);

      let bundle: PPLGrammarBundle;
      try {
        bundle = await http.get<PPLGrammarBundle>(ARTIFACT_ENDPOINT, {
          query,
          signal: abortController.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      // Shape validation + ATN deserialization live in the Node-safe
      // `ppl_grammar_deserialize` module (shared with the headless CI lint API).
      // A malformed bundle yields `null`; a corrupt-but-well-shaped ATN throws,
      // which the enclosing try/catch turns into the silent compiled fallback —
      // the browser's intended degrade-gracefully behavior.
      const entry = deserializeGrammarBundle(bundle);
      if (!entry) {
        return null;
      }

      // Only cache if the datasource hasn't changed while we were fetching.
      // A rapid ds-1 → ds-2 switch resets cachedDatasourceId; if ds-1's fetch
      // resolves late we must not overwrite ds-2's state.
      if (datasourceId !== this.cachedDatasourceId) {
        return null;
      }

      this.cachedGrammar = entry;
      this.notifyGrammarUpdate(datasourceId, entry);
      return entry;
    } catch {
      return null;
    }
  }

  private notifyGrammarUpdate(datasourceId: string | undefined, entry: CachedGrammar): void {
    for (const listener of this.grammarUpdateListeners) {
      try {
        listener({
          dataSourceId: datasourceId,
          grammarHash: entry.grammarHash,
        });
      } catch {
        // A failing listener must not prevent other listeners from being notified
        // or poison the grammar fetch promise chain.
      }
    }
  }

  private notifyVersionResolved(datasourceId: string | undefined, version: string): void {
    for (const listener of this.versionResolvedListeners) {
      try {
        listener({ dataSourceId: datasourceId, version });
      } catch {
        // A failing listener must not prevent other listeners from being notified.
      }
    }
  }
}

export const pplGrammarCache = new PPLGrammarCache();

// Synchronous render-time gate. When the version is unknown it intentionally
// returns `true` (optimistic) because the version is only knowable async, letting
// the later `warmUp` → `resolveVersion` → `shouldFetchFromBackend` chain make the
// real decision — which is why this and `shouldFetchFromBackend` treat an unknown
// version oppositely (deliberate, not a bug). It's safe: if the runtime grammar
// can't load, the runtime lint/validate paths return null and the editor falls
// back to the compiled grammar. Do NOT change this to `false` on unknown version —
// that breaks the local cluster.
export function shouldUseRuntimeGrammar(
  _dataSourceId?: string,
  dataSourceVersion?: string,
  dataSourceEngineType?: string
): boolean {
  // Engines without a runtime grammar endpoint (e.g. Elasticsearch) use the bundled grammar.
  if (!getDataSourceEngineCapabilities(dataSourceEngineType).supportsRuntimePplGrammar)
    return false;
  if (dataSourceVersion) {
    return pplGrammarCache.shouldFetchFromBackend(dataSourceVersion, dataSourceEngineType);
  }
  return true;
}

/**
 * Derive whether a data source runs the Calcite engine.
 *
 * An engine that speaks Open Distro SQL/PPL (Elasticsearch) has no Calcite
 * engine at all, so that answer is definitive. Otherwise the only proof is a
 * successful cluster-settings reading: `measuredCalciteEnabled` is the value the
 * route actually read, and `undefined` means it has not been read yet.
 *
 * The version alone is deliberately never enough to return `true`. It cannot see
 * an administratively-disabled Calcite on a >= 3.3.0 cluster, and treating it as
 * proof let Calcite-only rules fire on clusters that do not run Calcite. A
 * version below 3.3.0 is still conclusive in the negative direction.
 */
export function deriveIsCalcite(
  dataSourceVersion?: string,
  dataSourceEngineType?: string,
  measuredCalciteEnabled?: boolean
): boolean | undefined {
  if (getDataSourceEngineCapabilities(dataSourceEngineType).usesOpenDistroSqlPpl) {
    return false;
  }

  if (measuredCalciteEnabled !== undefined) {
    return measuredCalciteEnabled;
  }

  const coerced = dataSourceVersion ? semver.coerce(dataSourceVersion) : null;
  if (!coerced) {
    return undefined;
  }

  // Pre-Calcite cluster: conclusive. At or above 3.3.0 the engine is on by
  // default but may be disabled, so withhold judgement until measured.
  return semver.gte(coerced.version, '3.3.0') ? undefined : false;
}
