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
  ignoredTokens: Set<number>;
  rulesToVisit: Set<number>;
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
 * Build a TokenDictionary from backend symbolic names.
 * Maps semantic names used by autocomplete logic to token type IDs.
 */
function buildTokenDictionary(symbolicNames: Array<string | null>): TokenDictionary {
  const resolve = (name: string) => resolveTokenType(symbolicNames, name);
  return {
    SPACE: resolve('SPACE'),
    FROM: resolve('FROM'),
    OPENING_BRACKET: resolve('LT_PRTHS'),
    CLOSING_BRACKET: resolve('RT_PRTHS'),
    JOIN: resolve('JOIN'),
    SEMICOLON: resolve('SEMI'),
    SELECT: resolve('SELECT'),
    ID: resolve('ID'),
    // PPL-specific extensions (used by enrichAutocompleteResult)
    SEARCH: resolve('SEARCH'),
    SOURCE: resolve('SOURCE'),
    PIPE: resolve('PIPE'),
    EQUAL: resolve('EQUAL'),
    IN: resolve('IN'),
    COMMA: resolve('COMMA'),
    BACKTICK_QUOTE: resolve('BQUOTA_STRING'),
    DOT: resolve('DOT'),
  } as TokenDictionary;
}

/**
 * Build the set of ignored tokens from backend symbolic names.
 * Mirrors the logic in the compiled grammar's getIgnoredTokens().
 */
function buildIgnoredTokens(symbolicNames: Array<string | null>): Set<number> {
  const resolve = (name: string) => resolveTokenType(symbolicNames, name);
  const tokens: number[] = [];

  // Explicitly ignored
  const asToken = resolve('AS');
  const inToken = resolve('IN');
  if (asToken >= 0) tokens.push(asToken);
  if (inToken >= 0) tokens.push(inToken);

  // Operators to include (not ignored)
  const operatorsToInclude = new Set(
    [
      'PIPE',
      'EQUAL',
      'COMMA',
      'NOT_EQUAL',
      'LESS',
      'NOT_LESS',
      'GREATER',
      'NOT_GREATER',
      'OR',
      'AND',
      'LT_PRTHS',
      'RT_PRTHS',
      'IN',
      'SPAN',
      'MATCH',
      'MATCH_PHRASE',
      'MATCH_BOOL_PREFIX',
      'MATCH_PHRASE_PREFIX',
      'SQUOTA_STRING',
    ]
      .map((n) => resolve(n))
      .filter((id) => id >= 0)
  );

  // Ignore operator range: MATCH .. ERROR_RECOGNITION (excluding operatorsToInclude)
  const matchIdx = resolve('MATCH');
  const errorRecIdx = resolve('ERROR_RECOGNITION');
  if (matchIdx >= 0 && errorRecIdx >= 0) {
    for (let i = matchIdx; i <= errorRecIdx; i++) {
      if (!operatorsToInclude.has(i)) tokens.push(i);
    }
  }

  // Ignore function range: CASE .. CAST
  const caseIdx = resolve('CASE');
  const castIdx = resolve('CAST');
  if (caseIdx >= 0 && castIdx >= 0) {
    for (let i = caseIdx; i <= castIdx; i++) {
      if (!operatorsToInclude.has(i)) tokens.push(i);
    }
  }

  return new Set(tokens.filter((t) => t >= 0));
}

/**
 * Build the set of parser rules to visit from backend rule names.
 * Mirrors the compiled grammar's rulesToVisit set.
 */
function buildRulesToVisit(parserRuleNames: string[]): Set<number> {
  const resolve = (name: string) => resolveRuleIndex(parserRuleNames, name);
  const ruleNames = [
    'statsFunctionName',
    'takeAggFunction',
    'integerLiteral',
    'decimalLiteral',
    'keywordsCanBeId',
    'renameClasue',
    'qualifiedName',
    'tableQualifiedName',
    'wcQualifiedName',
    'positionFunctionName',
    'searchableKeyWord',
    'stringLiteral',
    'searchCommand',
    'searchComparisonOperator',
    'comparisonOperator',
    'sqlLikeJoinType',
    // Default grammar rules (may not exist in simplified grammar — resolve filters -1)
    'fieldExpression',
    'percentileAggFunction',
    'timestampFunctionName',
    'getFormatFunction',
    'tableIdent',
    'singleFieldRelevanceFunctionName',
    'multiFieldRelevanceFunctionName',
    'evalFunctionName',
    'literalValue',
    'logicalExpression',
  ];
  return new Set(ruleNames.map(resolve).filter((idx) => idx >= 0));
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
  return (result, rules, tokenStream, cursorTokenIndex, cursor, query, tree) => {
    // Remap rule indices: runtime → compiled
    const remappedRules = new Map<number, any>();
    for (const [runtimeRuleIdx, ruleData] of rules) {
      const compiledIdx = ruleRemap.get(runtimeRuleIdx);
      if (compiledIdx !== undefined) {
        // Also remap ruleList entries inside the CandidateRule
        const remappedRuleList = (ruleData.ruleList || [])
          .map((r: number) => ruleRemap.get(r))
          .filter((r: number | undefined): r is number => r !== undefined);
        remappedRules.set(compiledIdx, { ...ruleData, ruleList: remappedRuleList });
      }
    }

    // Create a proxy for tokenStream that remaps token types on access
    const proxyHandler: ProxyHandler<any> = {
      get(target, prop, receiver) {
        if (prop === 'get') {
          return (index: number) => {
            const token = target.get(index);
            if (!token) return token;
            const compiledType = tokenRemap.get(token.type);
            if (compiledType !== undefined && compiledType !== token.type) {
              // Return a lightweight wrapper with remapped type
              return new Proxy(token, {
                get(t, p) {
                  if (p === 'type') return compiledType;
                  return (t as any)[p];
                },
              });
            }
            return token;
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    };
    const remappedTokenStream = new Proxy(tokenStream, proxyHandler);

    // Also remap suggestKeywords IDs in the base result
    if (result.suggestKeywords) {
      result.suggestKeywords = result.suggestKeywords.map((kw) => ({
        ...kw,
        id: tokenRemap.get(kw.id) ?? kw.id,
      }));
    }

    return originalEnrich(
      result,
      remappedRules,
      remappedTokenStream,
      cursorTokenIndex,
      cursor,
      query,
      tree
    );
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

    const ParserCtor = function RuntimePPLParser(this: any, tokens: CommonTokenStream) {
      return new ParserInterpreter('PPL', vocabulary, parserRuleNames, parserATN, tokens);
    } as any;

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
        tokenDictionary: buildTokenDictionary(bundle.symbolicNames),
        ignoredTokens: buildIgnoredTokens(bundle.symbolicNames),
        rulesToVisit: buildRulesToVisit(bundle.parserRuleNames),
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
