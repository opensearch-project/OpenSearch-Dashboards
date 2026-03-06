/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { ATN, ATNDeserializer, Vocabulary } from 'antlr4ng';
import { PPLArtifactBundle } from './ppl_bundle_loader';
import { TokenDictionary } from '../opensearch_sql/table';

const ARTIFACT_ENDPOINT = '/api/enhancements/ppl/grammar';

/** Maximum number of datasource grammars to cache simultaneously */
const MAX_CACHE_SIZE = 5;

/** Default cache key for local cluster (no datasource ref) */
const DEFAULT_CACHE_KEY = 'default';

/** ATN deserialization options for autocomplete use */
const ATN_DESERIALIZE_OPTIONS = {
  readOnly: false,
  // Keep verification enabled since ATN bytes come from backend responses.
  verifyATN: true,
  generateRuleBypassTransitions: true,
};

/** Cached grammar entry with deserialized ATN objects */
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
  lastUsed: number;
  backendVersion: string;
  /** Dynamically resolved autocomplete metadata from backend grammar */
  tokenDictionary: TokenDictionary;
  ignoredTokens: number[];
  rulesToVisit: number[];
  /** Maps runtime symbolic token name → runtime token type ID */
  runtimeSymbolicNameToTokenType: Map<string, number>;
  /** Maps runtime rule name → runtime rule index */
  runtimeRuleNameToIndex: Map<string, number>;
}

/**
 * Build a map from symbolic token name → token type ID for the runtime grammar.
 */
function buildSymbolicNameToTokenType(symbolicNames: Array<string | null>): Map<string, number> {
  const map = new Map<string, number>();
  // Token slot 0 is INVALID_TYPE and should never be exposed as a valid token.
  for (let i = 1; i < symbolicNames.length; i++) {
    const name = symbolicNames[i];
    if (name) map.set(name, i);
  }
  return map;
}

/**
 * Build a map from rule name → rule index for the runtime grammar.
 */
function buildRuleNameToIndex(parserRuleNames: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < parserRuleNames.length; i++) {
    map.set(parserRuleNames[i], i);
  }
  return map;
}

/**
 * In-memory cache for PPL grammar artifacts, keyed by datasource ID.
 * Supports multi-datasource environments where each backend may have
 * a different PPL grammar version. Uses LRU eviction to bound memory.
 */
class PPLGrammarCache {
  /** Subscribers notified when a grammar bundle is successfully cached */
  private grammarUpdateListeners: Set<
    (event: { dataSourceId?: string; grammarHash: string }) => void
  > = new Set();

  /** Grammar cache: datasourceId → deserialized grammar */
  private grammarCache: Map<string, CachedGrammar> = new Map();

  /** Version cache: datasourceId → OpenSearch version string */
  private versionCache: Map<string, string> = new Map();

  /** In-flight fetch promises to avoid duplicate requests */
  private pendingFetches: Map<string, Promise<CachedGrammar | null>> = new Map();

  /** In-flight version fetch promises to avoid duplicate requests */
  private pendingVersionFetches: Map<string, Promise<string | undefined>> = new Map();

  /** Datasources where grammar fetch has already failed — avoid retrying until invalidated */
  private failedGrammarFetches: Set<string> = new Set();

  /** Datasources where version fetch has already failed — avoid retrying until invalidated */
  private failedVersionFetches: Set<string> = new Set();

  /**
   * Check if a given OpenSearch version supports the grammar artifact endpoint.
   * Returns true if version >= 3.6.0.
   */
  shouldFetchFromBackend(version?: string): boolean {
    if (!version) return false;

    // Accept standard semver and suffixed versions (e.g. 3.6.0-SNAPSHOT)
    const match = version.trim().match(/^(\d+)\.(\d+)/);
    if (!match) return false;
    const major = Number(match[1]);
    const minor = Number(match[2]);
    if (!Number.isFinite(major) || !Number.isFinite(minor)) return false;

    return major > 3 || (major === 3 && minor >= 6);
  }

  /**
   * Get the backend OpenSearch version for a datasource.
   * For remote datasources: reads dataSourceVersion from the saved object.
   * For local cluster (no datasourceId): fetches OSD server version via /api/status.
   * Caches the result to avoid repeated lookups.
   */
  async getBackendVersion(
    http: HttpSetup,
    savedObjectsClient: SavedObjectsClientContract,
    datasourceId?: string
  ): Promise<string | undefined> {
    const cacheKey = datasourceId || DEFAULT_CACHE_KEY;

    // Return cached version if available
    const cached = this.versionCache.get(cacheKey);
    if (cached) return cached;

    // Deduplicate in-flight version fetches
    const pending = this.pendingVersionFetches.get(cacheKey);
    if (pending) return pending;

    const fetchPromise = (async (): Promise<string | undefined> => {
      if (!datasourceId) {
        return this.fetchLocalClusterVersion(http);
      }
      try {
        const savedObject = await savedObjectsClient.get('data-source', datasourceId);
        const version = (savedObject.attributes as any)?.dataSourceVersion as string | undefined;
        if (version) {
          this.versionCache.set(cacheKey, version);
        }
        return version;
      } catch {
        return undefined;
      }
    })();

    this.pendingVersionFetches.set(cacheKey, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.pendingVersionFetches.delete(cacheKey);
    }
  }

  /**
   * Fetch the local cluster version from /api/status.
   * OSD version matches the local OpenSearch version.
   */
  private async fetchLocalClusterVersion(http: HttpSetup): Promise<string | undefined> {
    try {
      const response = await http.get<{ version: { number: string } }>('/api/status');
      const version = response?.version?.number;
      if (version) {
        this.versionCache.set(DEFAULT_CACHE_KEY, version);
      }
      return version;
    } catch {
      return undefined;
    }
  }

  /**
   * Get grammar from cache or fetch from backend.
   * Deduplicates concurrent requests for the same datasource.
   */
  async getOrFetchGrammar(http: HttpSetup, datasourceId?: string): Promise<CachedGrammar | null> {
    const cacheKey = datasourceId || DEFAULT_CACHE_KEY;

    // Cache hit — update LRU timestamp and return
    const cached = this.grammarCache.get(cacheKey);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached;
    }

    // Deduplicate in-flight fetches
    const pending = this.pendingFetches.get(cacheKey);
    if (pending) return pending;

    const fetchPromise = this.fetchAndCache(http, cacheKey, datasourceId);
    this.pendingFetches.set(cacheKey, fetchPromise);

    try {
      return await fetchPromise;
    } finally {
      this.pendingFetches.delete(cacheKey);
    }
  }

  /** Remove a specific datasource from both grammar and version caches */
  invalidate(datasourceId?: string): void {
    const cacheKey = datasourceId || DEFAULT_CACHE_KEY;
    this.grammarCache.delete(cacheKey);
    this.versionCache.delete(cacheKey);
    this.failedGrammarFetches.delete(cacheKey);
    this.failedVersionFetches.delete(cacheKey);
  }

  /**
   * Synchronously return cached version for a datasource, or undefined if not cached.
   * Does NOT trigger any network requests.
   */
  getCachedVersion(datasourceId?: string): string | undefined {
    return this.versionCache.get(datasourceId || DEFAULT_CACHE_KEY);
  }

  /**
   * Synchronously return cached grammar for a datasource, or null if not cached.
   * Does NOT trigger any network requests.
   */
  getCachedGrammar(datasourceId?: string): CachedGrammar | null {
    const cacheKey = datasourceId || DEFAULT_CACHE_KEY;
    const cached = this.grammarCache.get(cacheKey);
    if (cached) {
      cached.lastUsed = Date.now();
      return cached;
    }
    return null;
  }

  /**
   * Kick off background version + grammar fetch without blocking.
   * Safe to call repeatedly — deduplicates in-flight requests.
   * On completion the results are cached so the next synchronous
   * getCachedVersion / getCachedGrammar call will return them.
   */
  warmUp(
    http: HttpSetup,
    savedObjectsClient?: SavedObjectsClientContract,
    datasourceId?: string,
    datasourceVersion?: string
  ): void {
    const cacheKey = datasourceId || DEFAULT_CACHE_KEY;

    if (datasourceVersion) {
      this.versionCache.set(cacheKey, datasourceVersion);
    }

    // Grammar warm-up (only if not already cached, in-flight, or previously failed).
    // This is version-gated to avoid hitting the grammar endpoint for unsupported backends.
    if (
      !this.grammarCache.has(cacheKey) &&
      !this.pendingFetches.has(cacheKey) &&
      !this.failedGrammarFetches.has(cacheKey)
    ) {
      this.warmUpGrammarForDatasource(
        http,
        savedObjectsClient,
        cacheKey,
        datasourceId,
        datasourceVersion
      )
        .then((result) => {
          if (!result) {
            this.failedGrammarFetches.add(cacheKey);
          }
        })
        .catch(() => {
          this.failedGrammarFetches.add(cacheKey);
        });
    }
  }

  /** Clear all caches */
  clear(): void {
    this.grammarCache.clear();
    this.versionCache.clear();
    this.pendingFetches.clear();
    this.pendingVersionFetches.clear();
    this.failedGrammarFetches.clear();
    this.failedVersionFetches.clear();
  }

  subscribeToGrammarUpdates(
    listener: (event: { dataSourceId?: string; grammarHash: string }) => void
  ): () => void {
    this.grammarUpdateListeners.add(listener);
    return () => {
      this.grammarUpdateListeners.delete(listener);
    };
  }

  private async warmUpGrammarForDatasource(
    http: HttpSetup,
    savedObjectsClient: SavedObjectsClientContract | undefined,
    cacheKey: string,
    datasourceId?: string,
    datasourceVersion?: string
  ): Promise<CachedGrammar | null> {
    const backendVersion = await this.resolveBackendVersionForWarmUp(
      http,
      savedObjectsClient,
      cacheKey,
      datasourceId,
      datasourceVersion
    );
    if (!this.shouldFetchFromBackend(backendVersion)) {
      return null;
    }
    return this.getOrFetchGrammar(http, datasourceId);
  }

  private async resolveBackendVersionForWarmUp(
    http: HttpSetup,
    savedObjectsClient: SavedObjectsClientContract | undefined,
    cacheKey: string,
    datasourceId?: string,
    datasourceVersion?: string
  ): Promise<string | undefined> {
    if (datasourceVersion) {
      return datasourceVersion;
    }

    const cachedVersion = this.versionCache.get(cacheKey);
    if (cachedVersion) {
      return cachedVersion;
    }

    if (this.failedVersionFetches.has(cacheKey)) {
      return undefined;
    }

    if (datasourceId && !savedObjectsClient) {
      this.failedVersionFetches.add(cacheKey);
      return undefined;
    }

    try {
      const version = await this.getBackendVersion(http, savedObjectsClient!, datasourceId);
      if (!version) {
        this.failedVersionFetches.add(cacheKey);
      }
      return version;
    } catch {
      this.failedVersionFetches.add(cacheKey);
      return undefined;
    }
  }

  /** Fetch artifact bundle from backend, deserialize ATNs, and store in cache */
  private async fetchAndCache(
    http: HttpSetup,
    cacheKey: string,
    datasourceId?: string
  ): Promise<CachedGrammar | null> {
    try {
      const query: Record<string, string> = {};
      if (datasourceId) {
        query.dataSourceId = datasourceId;
      }

      // Abort if the backend doesn't respond within 10 seconds to avoid blocking the page
      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), 10000);

      let bundle: PPLArtifactBundle;
      try {
        bundle = await http.get<PPLArtifactBundle>(ARTIFACT_ENDPOINT, {
          query,
          signal: abortController.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!bundle || !bundle.lexerSerializedATN || !bundle.parserSerializedATN) {
        return null;
      }

      // Build vocabulary from bundle name arrays
      const literalNames = (bundle.literalNames || []).map((n) => (n === '' ? null : n));
      const symbolicNames = (bundle.symbolicNames || []).map((n) => (n === '' ? null : n));
      const vocabulary = new Vocabulary(literalNames, symbolicNames);

      // Deserialize ATN objects once — these are reused across all parser instances
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
        lastUsed: Date.now(),
        backendVersion: this.versionCache.get(cacheKey) || '',
        tokenDictionary: bundle.tokenDictionary,
        ignoredTokens: bundle.ignoredTokens,
        rulesToVisit: bundle.rulesToVisit,
        runtimeSymbolicNameToTokenType: buildSymbolicNameToTokenType(bundle.symbolicNames),
        runtimeRuleNameToIndex: buildRuleNameToIndex(bundle.parserRuleNames),
      };

      // Evict LRU if at capacity
      if (this.grammarCache.size >= MAX_CACHE_SIZE) {
        this.evictLRU();
      }

      this.grammarCache.set(cacheKey, entry);
      this.notifyGrammarUpdate(cacheKey, entry);
      return entry;
    } catch (error) {
      // Fetch or deserialization failed — caller should fall back to compiled grammar
      return null;
    }
  }

  /** Evict the least recently used grammar entry */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.grammarCache) {
      if (entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.grammarCache.delete(oldestKey);
    }
  }

  private notifyGrammarUpdate(cacheKey: string, entry: CachedGrammar): void {
    const dataSourceId = cacheKey === DEFAULT_CACHE_KEY ? undefined : cacheKey;
    for (const listener of this.grammarUpdateListeners) {
      listener({
        dataSourceId,
        grammarHash: entry.grammarHash,
      });
    }
  }
}

/** Singleton grammar cache instance */
export const pplGrammarCache = new PPLGrammarCache();
