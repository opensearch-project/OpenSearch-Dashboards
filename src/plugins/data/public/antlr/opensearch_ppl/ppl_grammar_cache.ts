/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import {
  ATN,
  ATNDeserializer,
  LexerInterpreter,
  ParserInterpreter,
  CharStream,
  CommonTokenStream,
  Vocabulary,
} from 'antlr4ng';
import { PPLArtifactBundle } from './ppl_artifact_loader';
import { TokenDictionary } from '../opensearch_sql/table';
import { EnrichAutocompleteResult, OpenSearchPplAutocompleteResult } from '../shared/types';

const ARTIFACT_ENDPOINT = '/api/enhancements/ppl/grammar';

/** Maximum number of datasource grammars to cache simultaneously */
const MAX_CACHE_SIZE = 5;

/** Default cache key for local cluster (no datasource ref) */
const DEFAULT_CACHE_KEY = 'default';

/** ATN deserialization options for autocomplete use */
const ATN_DESERIALIZE_OPTIONS = {
  readOnly: false,
  verifyATN: false,
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
 * Resolve a symbolic token name to its token type ID using the vocabulary.
 * Returns -1 if not found.
 */
function resolveTokenType(symbolicNames: Array<string | null>, name: string): number {
  const idx = symbolicNames.indexOf(name);
  return idx >= 0 ? idx : -1;
}

/**
 * Resolve a parser rule name to its rule index.
 * Returns -1 if not found.
 */
function resolveRuleIndex(parserRuleNames: string[], name: string): number {
  return parserRuleNames.indexOf(name);
}

/**
 * Build a map from symbolic token name → token type ID for the runtime grammar.
 */
function buildSymbolicNameToTokenType(symbolicNames: Array<string | null>): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < symbolicNames.length; i++) {
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
 * Build a mapping from runtime rule index → compiled rule index using rule names.
 * This allows processVisitedRules (which switches on compiled RULE_* constants)
 * to work with rules returned by CodeCompletionCore using the runtime grammar.
 */
function buildRuleIndexRemap(runtimeRuleNames: string[], compiledParser: any): Map<number, number> {
  const remap = new Map<number, number>();
  for (let runtimeIdx = 0; runtimeIdx < runtimeRuleNames.length; runtimeIdx++) {
    const ruleName = runtimeRuleNames[runtimeIdx];
    // Compiled parser constants are named RULE_<ruleName>
    const compiledIdx = compiledParser[`RULE_${ruleName}`];
    if (typeof compiledIdx === 'number') {
      remap.set(runtimeIdx, compiledIdx);
    }
  }
  return remap;
}

/**
 * Build a mapping from runtime token type → compiled token type using symbolic names.
 */
function buildTokenTypeRemap(
  runtimeSymbolicNames: Array<string | null>,
  compiledParser: any
): Map<number, number> {
  const remap = new Map<number, number>();
  for (let runtimeType = 0; runtimeType < runtimeSymbolicNames.length; runtimeType++) {
    const name = runtimeSymbolicNames[runtimeType];
    if (!name) continue;
    const compiledType = compiledParser[name];
    if (typeof compiledType === 'number') {
      remap.set(runtimeType, compiledType);
    }
  }
  return remap;
}

/**
 * Create a wrapped enrichAutocompleteResult that remaps runtime rule indices and
 * token types to compiled grammar indices before delegating to the original function.
 * This allows the existing processVisitedRules logic (which uses compiled OpenSearchPPLParser
 * constants) to work correctly with runtime grammar output.
 */
export function createRemappedEnrichment(
  originalEnrich: EnrichAutocompleteResult<OpenSearchPplAutocompleteResult>,
  ruleRemap: Map<number, number>,
  tokenRemap: Map<number, number>
): EnrichAutocompleteResult<OpenSearchPplAutocompleteResult> {
  // Build reverse rule remap (compiled → runtime) so rerunWithoutRules
  // indices can be translated back for the parseQuery rerun loop.
  const reverseRuleRemap = new Map<number, number>();
  for (const [runtime, compiled] of ruleRemap) {
    reverseRuleRemap.set(compiled, runtime);
  }

  return (result, rules, tokenStream, cursorTokenIndex, cursor, query, tree) => {
    // Remap rule indices: runtime → compiled
    const remappedRules = new Map<number, any>();
    for (const [runtimeRuleIdx, ruleData] of rules) {
      const compiledIdx = ruleRemap.get(runtimeRuleIdx);
      if (compiledIdx !== undefined) {
        const remappedRuleList = (ruleData.ruleList || [])
          .map((r: number) => ruleRemap.get(r))
          .filter((r: number | undefined): r is number => r !== undefined);
        remappedRules.set(compiledIdx, { ...ruleData, ruleList: remappedRuleList });
      }
    }

    // Wrap tokenStream with a lightweight object that remaps token types.
    // Uses a per-index cache so each token is wrapped at most once, avoiding
    // repeated Object.create calls when helpers loop over the same tokens.
    const tokenCache = new Map<number, any>();
    const remappedTokenStream = {
      get(index: number) {
        const cached = tokenCache.get(index);
        if (cached !== undefined) return cached;
        const token = tokenStream.get(index);
        if (!token) return token;
        const compiledType = tokenRemap.get(token.type);
        let mapped;
        if (compiledType !== undefined && compiledType !== token.type) {
          mapped = Object.create(token, {
            type: { value: compiledType, enumerable: true },
          });
        } else {
          mapped = token;
        }
        tokenCache.set(index, mapped);
        return mapped;
      },
      // Forward properties that enrichment functions may access
      get size() {
        return tokenStream.size;
      },
      getTokens() {
        return tokenStream.getTokens();
      },
      getText() {
        return tokenStream.getText();
      },
    };

    // Remap suggestKeywords IDs in the base result
    if (result.suggestKeywords) {
      result.suggestKeywords = result.suggestKeywords.map((kw) => ({
        ...kw,
        id: tokenRemap.get(kw.id) ?? kw.id,
      }));
    }

    const enriched = originalEnrich(
      result,
      remappedRules,
      remappedTokenStream as any,
      cursorTokenIndex,
      cursor,
      query,
      tree
    );

    // Reverse-remap rerunWithoutRules from compiled → runtime indices.
    // parseQuery's rerun loop deletes from the runtime rulesToVisit set,
    // so the indices must be in runtime space.
    if (enriched.rerunWithoutRules) {
      enriched.rerunWithoutRules = enriched.rerunWithoutRules
        .map((compiledIdx: number) => reverseRuleRemap.get(compiledIdx))
        .filter((idx: number | undefined): idx is number => idx !== undefined);
    }

    return enriched;
  };
}

/**
 * In-memory cache for PPL grammar artifacts, keyed by datasource ID.
 * Supports multi-datasource environments where each backend may have
 * a different PPL grammar version. Uses LRU eviction to bound memory.
 */
class PPLGrammarCache {
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

    const parts = version.split('.').map(Number);
    const [major = 0, minor = 0] = parts;

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

  /**
   * Create a LexerInterpreter + ParserInterpreter from cached grammar for a query.
   * Does NOT cache parser instances — only grammar data is cached.
   */
  createParser(
    query: string,
    grammar: CachedGrammar
  ): { lexer: LexerInterpreter; parser: ParserInterpreter; tokenStream: CommonTokenStream } {
    const { vocabulary, lexerATN, parserATN } = grammar;

    const lexer = new LexerInterpreter(
      'PPL',
      vocabulary,
      grammar.lexerRuleNames,
      grammar.channelNames,
      grammar.modeNames,
      lexerATN,
      CharStream.fromString(query)
    );

    const tokenStream = new CommonTokenStream(lexer);
    tokenStream.fill();

    const parser = new ParserInterpreter(
      'PPL',
      vocabulary,
      grammar.parserRuleNames,
      parserATN,
      tokenStream
    );

    return { lexer, parser, tokenStream };
  }

  /**
   * Get constructor-compatible wrapper classes for runtime PPL parser.
   * These can be passed directly to parseQuery's Lexer/Parser parameters,
   * allowing createParser to instantiate fresh interpreters for each parse.
   */
  getWrappedConstructors(
    grammar: CachedGrammar
  ): {
    Lexer: new (input: CharStream) => LexerInterpreter;
    Parser: new (input: CommonTokenStream) => ParserInterpreter;
  } {
    const {
      vocabulary,
      lexerATN,
      parserATN,
      lexerRuleNames,
      parserRuleNames,
      channelNames,
      modeNames,
    } = grammar;
    console.log('[autocomplete] getWrappedConstructors');
    const LexerCtor = function RuntimePPLLexer(this: any, input: CharStream) {
      return new LexerInterpreter(
        'PPL',
        vocabulary,
        lexerRuleNames,
        channelNames,
        modeNames,
        lexerATN,
        input
      );
    } as any;
    console.log('[autocomplete] LexerCtor: ', LexerCtor);
    const ParserCtor = function RuntimePPLParser(this: any, tokens: CommonTokenStream) {
      return new ParserInterpreter('PPL', vocabulary, parserRuleNames, parserATN, tokens);
    } as any;
    console.log('[autocomplete] ParserCtor: ', ParserCtor);
    return { Lexer: LexerCtor, Parser: ParserCtor };
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
    datasourceId?: string
  ): void {
    const cacheKey = datasourceId || DEFAULT_CACHE_KEY;

    // Version warm-up (only if not already cached, in-flight, or previously failed)
    // For local cluster (no datasourceId), savedObjectsClient is not needed
    if (
      !this.versionCache.has(cacheKey) &&
      !this.pendingVersionFetches.has(cacheKey) &&
      !this.failedVersionFetches.has(cacheKey)
    ) {
      if (!datasourceId || savedObjectsClient) {
        this.getBackendVersion(http, savedObjectsClient!, datasourceId)
          .then((version) => {
            if (!version) {
              this.failedVersionFetches.add(cacheKey);
            }
          })
          .catch(() => {
            this.failedVersionFetches.add(cacheKey);
          });
      }
    }

    // Grammar warm-up (only if not already cached, in-flight, or previously failed)
    if (
      !this.grammarCache.has(cacheKey) &&
      !this.pendingFetches.has(cacheKey) &&
      !this.failedGrammarFetches.has(cacheKey)
    ) {
      this.getOrFetchGrammar(http, datasourceId)
        .then((result) => {
          if (result === null) {
            this.failedGrammarFetches.add(cacheKey);
          }
        })
        .catch(() => {
          this.failedGrammarFetches.add(cacheKey);
        });
    }
  }

  /**
   * Build rule index and token type remapping tables for a cached grammar
   * against a compiled parser class (e.g., OpenSearchPPLParser or SimplifiedOpenSearchPPLParser).
   * The remaps translate runtime indices → compiled indices so that existing
   * processVisitedRules / enrichAutocompleteResult logic works unchanged.
   */
  buildRemaps(
    grammar: CachedGrammar,
    compiledParser: any
  ): { ruleRemap: Map<number, number>; tokenRemap: Map<number, number> } {
    return {
      ruleRemap: buildRuleIndexRemap(grammar.parserRuleNames, compiledParser),
      tokenRemap: buildTokenTypeRemap(
        Array.from({ length: grammar.vocabulary.maxTokenType + 1 }, (_, i) =>
          grammar.vocabulary.getSymbolicName(i)
        ),
        compiledParser
      ),
    };
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

      // Use backend-provided autocomplete config when available,
      // fall back to local computation from symbolic/rule names.
      // const resolvedTokenDictionary = bundle.tokenDictionary
      //   ? (bundle.tokenDictionary as any as TokenDictionary)
      //   : buildTokenDictionary(symbolicNames);
      // const resolvedIgnoredTokens =
      //   bundle.ignoredTokens && bundle.ignoredTokens.length > 0
      //     ? new Set(bundle.ignoredTokens)
      //     : buildIgnoredTokens(symbolicNames);
      // const resolvedRulesToVisit =
      //   bundle.rulesToVisit && bundle.rulesToVisit.length > 0
      //     ? new Set(bundle.rulesToVisit)
      //     : buildRulesToVisit(bundle.parserRuleNames);

      const entry: CachedGrammar = {
        lexerATN,
        parserATN,
        vocabulary,
        lexerRuleNames: bundle.lexerRuleNames,
        parserRuleNames: bundle.parserRuleNames,
        channelNames: bundle.channelNames,
        modeNames: bundle.modeNames,
        startRuleIndex: bundle.startRuleIndex,
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
}

/** Singleton grammar cache instance */
export const pplGrammarCache = new PPLGrammarCache();
