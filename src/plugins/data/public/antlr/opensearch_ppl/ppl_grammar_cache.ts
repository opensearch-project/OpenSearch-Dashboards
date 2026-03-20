/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HttpSetup,
  IUiSettingsClient,
  SavedObjectsClientContract,
} from 'opensearch-dashboards/public';
import { ATN, ATNDeserializer, Vocabulary } from 'antlr4ng';
import semver from 'semver';
import { PPLGrammarBundle } from './ppl_bundle_loader';
import { TokenDictionary } from '../opensearch_sql/table';

const ARTIFACT_ENDPOINT = '/api/enhancements/ppl/grammar';

const ATN_DESERIALIZE_OPTIONS = {
  readOnly: false,
  verifyATN: true,
  generateRuleBypassTransitions: true,
};

export interface CachedGrammar {
  lexerATN: ATN;
  parserATN: ATN;
  vocabulary: Vocabulary;
  lexerRuleNames: string[];
  parserRuleNames: string[];
  channelNames: string[];
  modeNames: string[];
  startRuleIndex: number;
  pipeStartRuleIndex?: number;
  grammarHash: string;
  tokenDictionary: TokenDictionary;
  ignoredTokens: number[];
  rulesToVisit: number[];
  runtimeSymbolicNameToTokenType: Map<string, number>;
  runtimeRuleNameToIndex: Map<string, number>;
}

function buildSymbolicNameToTokenType(symbolicNames: Array<string | null>): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 1; i < symbolicNames.length; i++) {
    const name = symbolicNames[i];
    if (name) map.set(name, i);
  }
  return map;
}

function buildRuleNameToIndex(parserRuleNames: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < parserRuleNames.length; i++) {
    map.set(parserRuleNames[i], i);
  }
  return map;
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isStringOrNullArray(value: unknown): value is Array<string | null> {
  return Array.isArray(value) && value.every((item) => item === null || typeof item === 'string');
}

function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'number' && Number.isFinite(item))
  );
}

function isRecordOfNumbers(value: unknown): value is Record<string, number> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === 'number' && Number.isFinite(item))
  );
}

function isValidBundleShape(bundle: unknown): bundle is PPLGrammarBundle {
  if (typeof bundle !== 'object' || bundle === null) {
    return false;
  }

  const candidate = bundle as Partial<PPLGrammarBundle>;

  if (
    !isNumberArray(candidate.lexerSerializedATN) ||
    !isNumberArray(candidate.parserSerializedATN) ||
    !isStringArray(candidate.lexerRuleNames) ||
    !isStringArray(candidate.parserRuleNames) ||
    !isStringArray(candidate.channelNames) ||
    !isStringArray(candidate.modeNames) ||
    !isStringOrNullArray(candidate.literalNames) ||
    !isStringOrNullArray(candidate.symbolicNames) ||
    !isFiniteInteger(candidate.startRuleIndex) ||
    typeof candidate.grammarHash !== 'string'
  ) {
    return false;
  }

  if (
    candidate.startRuleIndex < 0 ||
    candidate.startRuleIndex >= candidate.parserRuleNames.length
  ) {
    return false;
  }

  if (
    candidate.pipeStartRuleIndex !== undefined &&
    (!isFiniteInteger(candidate.pipeStartRuleIndex) ||
      candidate.pipeStartRuleIndex < 0 ||
      candidate.pipeStartRuleIndex >= candidate.parserRuleNames.length)
  ) {
    return false;
  }

  if (candidate.tokenDictionary !== undefined && !isRecordOfNumbers(candidate.tokenDictionary)) {
    return false;
  }

  if (candidate.ignoredTokens !== undefined && !isNumberArray(candidate.ignoredTokens)) {
    return false;
  }

  if (candidate.rulesToVisit !== undefined && !isNumberArray(candidate.rulesToVisit)) {
    return false;
  }

  return true;
}

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

  private cachedDatasourceId: string | undefined;
  private cachedVersion: string | undefined;
  private cachedGrammar: CachedGrammar | null = null;
  private pendingFetch: Promise<CachedGrammar | null> | null = null;
  private fetchFailed = false;
  private fetchFailedAt = 0;

  /**
   * Returns true if version >= 3.6.0 (grammar artifact endpoint support).
   */
  shouldFetchFromBackend(version?: string): boolean {
    if (!version) return false;
    const coerced = semver.coerce(version);
    return coerced ? semver.satisfies(coerced.version, '>=3.6.0') : false;
  }

  getCachedGrammar(datasourceId?: string): CachedGrammar | null {
    if (datasourceId !== this.cachedDatasourceId) return null;
    return this.cachedGrammar;
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
    datasourceVersion?: string
  ): void {
    // Check feature flag - if disabled, reset cache state but keep subscribers
    const runtimeGrammarEnabled = uiSettings?.get('query:enhancements:runtimePplGrammar') !== false;
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

    const promise = this.doWarmUp(http, savedObjectsClient, datasourceId, datasourceVersion);
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

  /** Reset all cache state AND unregister all grammar-update listeners. */
  dispose(): void {
    this.reset();
    this.grammarUpdateListeners.clear();
  }

  subscribeToGrammarUpdates(
    listener: (event: { dataSourceId?: string; grammarHash: string }) => void
  ): () => void {
    this.grammarUpdateListeners.add(listener);
    return () => {
      this.grammarUpdateListeners.delete(listener);
    };
  }

  private async doWarmUp(
    http: HttpSetup,
    savedObjectsClient: SavedObjectsClientContract | undefined,
    datasourceId?: string,
    datasourceVersion?: string
  ): Promise<CachedGrammar | null> {
    const version = await this.resolveVersion(
      http,
      savedObjectsClient,
      datasourceId,
      datasourceVersion
    );
    if (!this.shouldFetchFromBackend(version)) {
      // Version unsupported or unknown — not a failure, just nothing to fetch.
      // Don't set fetchFailed so that future warmUp calls can retry when the
      // version becomes available (e.g. /api/status wasn't ready on page load).
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
        // Local cluster — read OSD server version from /api/status.
        const response = await http.get<{ version?: { number?: string } }>('/api/status');
        version = response?.version?.number;
      }
      if (version) {
        this.cachedVersion = version;
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

      if (!isValidBundleShape(bundle)) {
        return null;
      }

      const literalNames = (bundle.literalNames || []).map((n) => (n === '' ? null : n));
      const symbolicNames = (bundle.symbolicNames || []).map((n) => (n === '' ? null : n));
      const vocabulary = new Vocabulary(literalNames, symbolicNames);

      const lexerATN = new ATNDeserializer(ATN_DESERIALIZE_OPTIONS).deserialize(
        bundle.lexerSerializedATN
      );
      const parserATN = new ATNDeserializer(ATN_DESERIALIZE_OPTIONS).deserialize(
        bundle.parserSerializedATN
      );

      const entry: CachedGrammar = {
        lexerATN,
        parserATN,
        vocabulary,
        lexerRuleNames: bundle.lexerRuleNames,
        parserRuleNames: bundle.parserRuleNames,
        channelNames: bundle.channelNames,
        modeNames: bundle.modeNames,
        startRuleIndex: bundle.startRuleIndex,
        pipeStartRuleIndex: bundle.pipeStartRuleIndex,
        grammarHash: bundle.grammarHash,
        tokenDictionary: (bundle.tokenDictionary ?? {}) as TokenDictionary,
        ignoredTokens: bundle.ignoredTokens ?? [],
        rulesToVisit: bundle.rulesToVisit ?? [],
        runtimeSymbolicNameToTokenType: buildSymbolicNameToTokenType(bundle.symbolicNames),
        runtimeRuleNameToIndex: buildRuleNameToIndex(bundle.parserRuleNames),
      };

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
}

export const pplGrammarCache = new PPLGrammarCache();

export function shouldUseRuntimeGrammar(
  _dataSourceId?: string,
  dataSourceVersion?: string
): boolean {
  if (dataSourceVersion) {
    return pplGrammarCache.shouldFetchFromBackend(dataSourceVersion);
  }
  return true;
}
