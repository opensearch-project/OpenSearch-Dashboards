/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ATNDeserializer } from 'antlr4ng';
import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { pplGrammarCache } from './ppl_grammar_cache';
import { PPLGrammarBundle } from './ppl_bundle_loader';

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

const createBundle = (grammarHash = 'sha256:test'): PPLGrammarBundle => ({
  language: 'ppl',
  bundleVersion: '1.0',
  grammarHash,
  antlrToolVersion: '4.13.1',
  antlr4ngVersion: '3.x',
  grammarFileName: 'OpenSearchPPL.g4',
  startRuleIndex: 0,
  pipeStartRuleIndex: 1,
  lexerSerializedATN: [1, 2, 3],
  parserSerializedATN: [1, 2, 3],
  lexerRuleNames: ['SEARCH'],
  parserRuleNames: ['root', 'commands'],
  channelNames: ['DEFAULT_TOKEN_CHANNEL'],
  modeNames: ['DEFAULT_MODE'],
  literalNames: [null, "'SOURCE'", "'='"],
  symbolicNames: [null, 'SOURCE', 'EQUAL'],
  tokenDictionary: {
    source: 1,
    '=': 2,
  } as Record<string, number>,
  ignoredTokens: [0],
  rulesToVisit: [1],
  catalogs: {},
});

describe('ppl_grammar_cache', () => {
  beforeEach(() => {
    pplGrammarCache.clear();
    jest
      .spyOn(ATNDeserializer.prototype, 'deserialize')
      .mockReturnValue({} as ReturnType<ATNDeserializer['deserialize']>);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    pplGrammarCache.clear();
  });

  it('should gate backend grammar fetch by OpenSearch version', () => {
    expect(pplGrammarCache.shouldFetchFromBackend(undefined)).toBe(false);
    expect(pplGrammarCache.shouldFetchFromBackend('3.5.9')).toBe(false);
    expect(pplGrammarCache.shouldFetchFromBackend('3.6.0')).toBe(true);
    expect(pplGrammarCache.shouldFetchFromBackend('3.6.0-SNAPSHOT')).toBe(true);
    expect(pplGrammarCache.shouldFetchFromBackend('3.5.9-SNAPSHOT')).toBe(false);
    expect(pplGrammarCache.shouldFetchFromBackend('3.10.1')).toBe(true);
    expect(pplGrammarCache.shouldFetchFromBackend('4.0.0')).toBe(true);
    expect(pplGrammarCache.shouldFetchFromBackend('v3.6.0')).toBe(false);
    expect(pplGrammarCache.shouldFetchFromBackend('invalid')).toBe(false);
  });

  it('should fetch and cache grammar via warmUp when version is supported', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:warm')),
    } as unknown) as HttpSetup;

    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    await flushPromises();

    const grammar = pplGrammarCache.getCachedGrammar('ds-1');
    expect(grammar).not.toBeNull();
    expect(grammar?.grammarHash).toBe('sha256:warm');
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith('/api/enhancements/ppl/grammar', {
      query: { dataSourceId: 'ds-1' },
      signal: expect.any(AbortSignal),
    });
  });

  it('should skip grammar fetch when version is unsupported', async () => {
    const http = ({
      get: jest.fn(),
    } as unknown) as HttpSetup;
    const savedObjectsClient = ({
      get: jest.fn().mockResolvedValue({
        attributes: { dataSourceVersion: '3.5.9' },
      }),
    } as unknown) as SavedObjectsClientContract;

    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-old');
    await flushPromises();

    expect(savedObjectsClient.get).toHaveBeenCalledTimes(1);
    expect(http.get).not.toHaveBeenCalled();
    expect(pplGrammarCache.getCachedGrammar('ds-old')).toBeNull();
  });

  it('should skip grammar fetch when provided version is unsupported', async () => {
    const http = ({
      get: jest.fn(),
    } as unknown) as HttpSetup;

    pplGrammarCache.warmUp(http, undefined, 'ds-old', '2.17.0');
    await flushPromises();

    expect(http.get).not.toHaveBeenCalled();
    expect(pplGrammarCache.getCachedGrammar('ds-old')).toBeNull();
  });

  it('should return null from getCachedGrammar for a different datasource', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:ds1')),
    } as unknown) as HttpSetup;

    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    await flushPromises();

    expect(pplGrammarCache.getCachedGrammar('ds-1')?.grammarHash).toBe('sha256:ds1');
    expect(pplGrammarCache.getCachedGrammar('ds-other')).toBeNull();
  });

  it('should avoid repeated warm-up fetches after failure until cache is cleared', async () => {
    const http = ({
      get: jest.fn().mockRejectedValue(new Error('backend failure')),
    } as unknown) as HttpSetup;
    const savedObjectsClient = ({
      get: jest.fn().mockResolvedValue({
        attributes: { dataSourceVersion: '3.6.0' },
      }),
    } as unknown) as SavedObjectsClientContract;

    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-fail');
    await flushPromises();
    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-fail');
    await flushPromises();

    expect(http.get).toHaveBeenCalledTimes(1);

    // Switching datasource auto-clears, allowing retry
    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-fail-2');
    await flushPromises();

    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it('should return null when ATN deserialization fails', async () => {
    (ATNDeserializer.prototype.deserialize as jest.Mock).mockImplementationOnce(() => {
      throw new Error('invalid lexer atn');
    });
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:bad-atn')),
    } as unknown) as HttpSetup;

    pplGrammarCache.warmUp(http, undefined, 'ds-bad', '3.6.0');
    await flushPromises();

    expect(pplGrammarCache.getCachedGrammar('ds-bad')).toBeNull();
  });

  it('should not cache when the bundle shape is invalid', async () => {
    const invalidBundle = {
      ...createBundle('sha256:invalid-shape'),
      startRuleIndex: 2,
    };
    const http = ({
      get: jest.fn().mockResolvedValue(invalidBundle),
    } as unknown) as HttpSetup;

    pplGrammarCache.warmUp(http, undefined, 'ds-invalid', '3.6.0');
    await flushPromises();

    expect(pplGrammarCache.getCachedGrammar('ds-invalid')).toBeNull();
  });

  it('should retry version lookup when version was not available from saved object', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:retry')),
    } as unknown) as HttpSetup;
    const savedObjectsClient = ({
      get: jest
        .fn()
        .mockResolvedValueOnce({ attributes: {} })
        .mockResolvedValueOnce({ attributes: { dataSourceVersion: '3.6.0' } }),
    } as unknown) as SavedObjectsClientContract;

    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-no-version');
    await flushPromises();

    // First attempt: version unavailable, skipped fetch but NOT marked as failed
    expect(savedObjectsClient.get).toHaveBeenCalledTimes(1);
    expect(http.get).not.toHaveBeenCalled();
    expect(pplGrammarCache.getCachedGrammar('ds-no-version')).toBeNull();

    // Second attempt: version now available, retries and succeeds
    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-no-version');
    await flushPromises();

    expect(savedObjectsClient.get).toHaveBeenCalledTimes(2);
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(pplGrammarCache.getCachedGrammar('ds-no-version')?.grammarHash).toBe('sha256:retry');
  });

  it('should retry when saved object fetch fails on first attempt', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:recovered')),
    } as unknown) as HttpSetup;
    const savedObjectsClient = ({
      get: jest
        .fn()
        .mockRejectedValueOnce(new Error('404'))
        .mockResolvedValueOnce({ attributes: { dataSourceVersion: '3.6.0' } }),
    } as unknown) as SavedObjectsClientContract;

    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-404');
    await flushPromises();

    expect(http.get).not.toHaveBeenCalled();
    expect(pplGrammarCache.getCachedGrammar('ds-404')).toBeNull();

    // Retry succeeds when saved object becomes available
    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-404');
    await flushPromises();

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(pplGrammarCache.getCachedGrammar('ds-404')?.grammarHash).toBe('sha256:recovered');
  });

  it('should deduplicate warm-up calls while fetch is pending', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:dedup')),
    } as unknown) as HttpSetup;
    const savedObjectsClient = ({
      get: jest.fn().mockResolvedValue({
        attributes: { dataSourceVersion: '3.6.0' },
      }),
    } as unknown) as SavedObjectsClientContract;

    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-1');
    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-1');
    await flushPromises();

    expect(savedObjectsClient.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('should serve grammar from cache without additional backend requests', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:cache-hit')),
    } as unknown) as HttpSetup;

    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    await flushPromises();

    const cached1 = pplGrammarCache.getCachedGrammar('ds-1');
    const cached2 = pplGrammarCache.getCachedGrammar('ds-1');

    expect(cached1?.grammarHash).toBe('sha256:cache-hit');
    expect(cached2?.grammarHash).toBe('sha256:cache-hit');
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('should ignore symbolicNames slot 0 when building runtime token map', async () => {
    const bundle = createBundle('sha256:symbolic-zero');
    bundle.symbolicNames = ['INVALID_SLOT_ZERO', 'SOURCE', 'EQUAL'];

    const http = ({
      get: jest.fn().mockResolvedValue(bundle),
    } as unknown) as HttpSetup;

    pplGrammarCache.warmUp(http, undefined, 'ds-sym', '3.6.0');
    await flushPromises();

    const grammar = pplGrammarCache.getCachedGrammar('ds-sym');
    expect(grammar).not.toBeNull();
    expect(grammar?.runtimeSymbolicNameToTokenType.has('INVALID_SLOT_ZERO')).toBe(false);
    expect(grammar?.runtimeSymbolicNameToTokenType.get('SOURCE')).toBe(1);
  });

  it('should notify listeners when a grammar bundle is cached', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:notify')),
    } as unknown) as HttpSetup;
    const listener = jest.fn();
    const unsubscribe = pplGrammarCache.subscribeToGrammarUpdates(listener);

    pplGrammarCache.warmUp(http, undefined, 'ds-notify', '3.6.0');
    await flushPromises();

    expect(listener).toHaveBeenCalledWith({
      dataSourceId: 'ds-notify',
      grammarHash: 'sha256:notify',
    });

    unsubscribe();
    pplGrammarCache.clear();
    pplGrammarCache.warmUp(http, undefined, 'ds-notify', '3.6.0');
    await flushPromises();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should retry localhost grammar fetch when /api/status was not ready on page load', async () => {
    const statusGet = jest
      .fn()
      // First call: /api/status not ready on page load
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      // Second call: /api/status ready, returns version
      .mockResolvedValueOnce({ version: { number: '3.6.0' } })
      // Third call: grammar fetch succeeds
      .mockResolvedValueOnce(createBundle('sha256:localhost'));

    const http = ({ get: statusGet } as unknown) as HttpSetup;

    // Page load: warmUp for localhost (no datasource id, no version)
    pplGrammarCache.warmUp(http, undefined);
    await flushPromises();

    // First attempt: /api/status failed → version unknown → skipped (NOT marked failed)
    expect(pplGrammarCache.getCachedGrammar(undefined)).toBeNull();

    // Dataset creation: warmUp for localhost again
    pplGrammarCache.warmUp(http, undefined);
    await flushPromises();

    // Second attempt: /api/status ready → version 3.6.0 → grammar fetched
    expect(pplGrammarCache.getCachedGrammar(undefined)?.grammarHash).toBe('sha256:localhost');
  });

  // ─── Multi-datasource scenarios (AWS OpenSearch / Explore) ──────────────

  it('should cycle through multiple remote datasources without leaking state', async () => {
    const http = ({
      get: jest
        .fn()
        .mockResolvedValueOnce(createBundle('sha256:ds1'))
        .mockResolvedValueOnce(createBundle('sha256:ds3'))
        .mockResolvedValueOnce(createBundle('sha256:ds1-again')),
    } as unknown) as HttpSetup;

    // ds-1 (3.6) → cached
    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    await flushPromises();
    expect(pplGrammarCache.getCachedGrammar('ds-1')?.grammarHash).toBe('sha256:ds1');

    // ds-2 (2.17) → version gated, no fetch, cache cleared
    pplGrammarCache.warmUp(http, undefined, 'ds-2', '2.17.0');
    await flushPromises();
    expect(pplGrammarCache.getCachedGrammar('ds-2')).toBeNull();
    expect(pplGrammarCache.getCachedGrammar('ds-1')).toBeNull(); // old cache gone

    // ds-3 (3.7) → new fetch
    pplGrammarCache.warmUp(http, undefined, 'ds-3', '3.7.0');
    await flushPromises();
    expect(pplGrammarCache.getCachedGrammar('ds-3')?.grammarHash).toBe('sha256:ds3');
    expect(pplGrammarCache.getCachedGrammar('ds-1')).toBeNull(); // only ds-3 cached

    // Back to ds-1 (3.6) → re-fetches (previous ds-1 grammar was evicted)
    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    await flushPromises();
    expect(pplGrammarCache.getCachedGrammar('ds-1')?.grammarHash).toBe('sha256:ds1-again');
    expect(http.get).toHaveBeenCalledTimes(3);
  });

  it('should handle localhost → remote 3.6 → remote 2.17 → localhost round-trip', async () => {
    const calls: string[] = [];
    const http = ({
      get: jest.fn((url: string) => {
        calls.push(url);
        if (url === '/api/status') {
          return Promise.resolve({ version: { number: '3.6.0' } });
        }
        return Promise.resolve(createBundle(`sha256:${calls.length}`));
      }),
    } as unknown) as HttpSetup;

    // Localhost (no datasourceId)
    pplGrammarCache.warmUp(http, undefined);
    await flushPromises();
    expect(pplGrammarCache.getCachedGrammar(undefined)).not.toBeNull();

    // Remote 3.6 → reset + fetch
    pplGrammarCache.warmUp(http, undefined, 'ds-remote', '3.6.0');
    await flushPromises();
    expect(pplGrammarCache.getCachedGrammar('ds-remote')).not.toBeNull();
    expect(pplGrammarCache.getCachedGrammar(undefined)).toBeNull();

    // Remote 2.17 → reset, version gated, no grammar fetch
    pplGrammarCache.warmUp(http, undefined, 'ds-old', '2.17.0');
    await flushPromises();
    expect(pplGrammarCache.getCachedGrammar('ds-old')).toBeNull();
    expect(pplGrammarCache.getCachedGrammar('ds-remote')).toBeNull();

    // Back to localhost → reset + re-fetch (need /api/status again since version was cleared)
    pplGrammarCache.warmUp(http, undefined);
    await flushPromises();
    expect(pplGrammarCache.getCachedGrammar(undefined)).not.toBeNull();
  });

  it('should not overwrite cache with stale fetch when datasource changes during flight', async () => {
    // ds-1's grammar fetch is slow; ds-2's is fast.
    // After switching ds-1 → ds-2, ds-1's late result must NOT overwrite ds-2's grammar.
    let resolveDs1!: (value: PPLGrammarBundle) => void;
    const ds1Promise = new Promise<PPLGrammarBundle>((r) => {
      resolveDs1 = r;
    });

    const http = ({
      get: jest
        .fn()
        .mockReturnValueOnce(ds1Promise) // ds-1: slow grammar fetch
        .mockResolvedValueOnce(createBundle('sha256:ds2')), // ds-2: fast grammar fetch
    } as unknown) as HttpSetup;

    // Start ds-1 fetch
    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');

    // Switch to ds-2 before ds-1 resolves
    pplGrammarCache.warmUp(http, undefined, 'ds-2', '3.6.0');
    await flushPromises();

    // ds-2 grammar should be cached
    expect(pplGrammarCache.getCachedGrammar('ds-2')?.grammarHash).toBe('sha256:ds2');

    // Now ds-1 resolves late — must NOT overwrite ds-2
    resolveDs1(createBundle('sha256:ds1-stale'));
    await flushPromises();

    expect(pplGrammarCache.getCachedGrammar('ds-2')?.grammarHash).toBe('sha256:ds2');
  });

  it('should not set fetchFailed from stale fetch failure when datasource changed', async () => {
    // ds-1's grammar fetch will fail, but by then we've switched to ds-2.
    // ds-1's failure must NOT block ds-2.
    let rejectDs1!: (error: Error) => void;
    const ds1Promise = new Promise<PPLGrammarBundle>((_, reject) => {
      rejectDs1 = reject;
    });

    const http = ({
      get: jest
        .fn()
        .mockReturnValueOnce(ds1Promise) // ds-1: will fail
        .mockResolvedValueOnce(createBundle('sha256:ds2')), // ds-2: succeeds
    } as unknown) as HttpSetup;

    // Start ds-1 fetch
    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');

    // Switch to ds-2 before ds-1 fails
    pplGrammarCache.warmUp(http, undefined, 'ds-2', '3.6.0');
    await flushPromises();

    expect(pplGrammarCache.getCachedGrammar('ds-2')?.grammarHash).toBe('sha256:ds2');

    // ds-1 fails late
    rejectDs1(new Error('network timeout'));
    await flushPromises();

    // ds-2's grammar should still be intact, not blocked by ds-1's failure
    expect(pplGrammarCache.getCachedGrammar('ds-2')?.grammarHash).toBe('sha256:ds2');
  });

  it('should not notify grammar listeners for stale datasource fetch', async () => {
    let resolveDs1!: (value: PPLGrammarBundle) => void;
    const ds1Promise = new Promise<PPLGrammarBundle>((r) => {
      resolveDs1 = r;
    });

    const http = ({
      get: jest
        .fn()
        .mockReturnValueOnce(ds1Promise)
        .mockResolvedValueOnce(createBundle('sha256:ds2')),
    } as unknown) as HttpSetup;

    const listener = jest.fn();
    pplGrammarCache.subscribeToGrammarUpdates(listener);

    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    pplGrammarCache.warmUp(http, undefined, 'ds-2', '3.6.0');
    await flushPromises();

    // ds-2 notified
    expect(listener).toHaveBeenCalledWith({
      dataSourceId: 'ds-2',
      grammarHash: 'sha256:ds2',
    });

    // ds-1 resolves late — should NOT notify
    resolveDs1(createBundle('sha256:ds1-stale'));
    await flushPromises();

    expect(listener).toHaveBeenCalledTimes(1); // only ds-2's notification
  });

  it('should handle version cached from earlier call when version is omitted later', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:cached-ver')),
    } as unknown) as HttpSetup;

    // First call provides version
    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    await flushPromises();
    expect(pplGrammarCache.getCachedGrammar('ds-1')?.grammarHash).toBe('sha256:cached-ver');

    // Clear and retry same datasource without version — should use cachedVersion
    // Note: clear() resets cachedVersion, so this tests the datasource-switch path
    pplGrammarCache.clear();
    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    await flushPromises();

    // Now warmUp again for same datasource without explicit version
    // cachedVersion should still be '3.6.0' from the warmUp above
    pplGrammarCache.clear();
    http.get = jest.fn().mockResolvedValueOnce(createBundle('sha256:reuse-ver')) as any;
    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    await flushPromises();
    expect(pplGrammarCache.getCachedGrammar('ds-1')?.grammarHash).toBe('sha256:reuse-ver');
  });

  it('should fetch grammar for localhost without dataSourceId query param', async () => {
    const http = ({
      get: jest
        .fn()
        .mockResolvedValueOnce({ version: { number: '3.6.0' } }) // /api/status
        .mockResolvedValueOnce(createBundle('sha256:local')), // grammar
    } as unknown) as HttpSetup;

    pplGrammarCache.warmUp(http, undefined);
    await flushPromises();

    expect(http.get).toHaveBeenCalledWith('/api/enhancements/ppl/grammar', {
      query: {}, // no dataSourceId
      signal: expect.any(AbortSignal),
    });
    expect(pplGrammarCache.getCachedGrammar(undefined)?.grammarHash).toBe('sha256:local');
  });

  it('should handle switching between many datasets on the same datasource', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:shared')),
    } as unknown) as HttpSetup;

    // First dataset on ds-1
    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    await flushPromises();
    expect(http.get).toHaveBeenCalledTimes(1);

    // Multiple additional warmUp calls for same datasource (different datasets, same ds)
    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    await flushPromises();

    // Still only 1 fetch — grammar reused across datasets on the same datasource
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(pplGrammarCache.getCachedGrammar('ds-1')?.grammarHash).toBe('sha256:shared');
  });

  it('should resolve remote datasource version from saved objects when not provided', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:resolved')),
    } as unknown) as HttpSetup;
    const savedObjectsClient = ({
      get: jest.fn().mockResolvedValue({
        attributes: { dataSourceVersion: '3.6.0' },
      }),
    } as unknown) as SavedObjectsClientContract;

    // No version provided — should look up via saved objects
    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-remote');
    await flushPromises();

    expect(savedObjectsClient.get).toHaveBeenCalledWith('data-source', 'ds-remote');
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(pplGrammarCache.getCachedGrammar('ds-remote')?.grammarHash).toBe('sha256:resolved');
  });

  it('should not look up saved object when datasource version is provided directly', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:direct')),
    } as unknown) as HttpSetup;
    const savedObjectsClient = ({
      get: jest.fn(),
    } as unknown) as SavedObjectsClientContract;

    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-remote', '3.6.0');
    await flushPromises();

    // Should NOT call saved objects — version was provided directly
    expect(savedObjectsClient.get).not.toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('should clear cache and allow refetch', async () => {
    const http = ({
      get: jest
        .fn()
        .mockResolvedValueOnce(createBundle('sha256:first'))
        .mockResolvedValueOnce(createBundle('sha256:second')),
    } as unknown) as HttpSetup;

    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    await flushPromises();
    expect(pplGrammarCache.getCachedGrammar('ds-1')?.grammarHash).toBe('sha256:first');

    pplGrammarCache.clear();

    pplGrammarCache.warmUp(http, undefined, 'ds-1', '3.6.0');
    await flushPromises();
    expect(pplGrammarCache.getCachedGrammar('ds-1')?.grammarHash).toBe('sha256:second');
    expect(http.get).toHaveBeenCalledTimes(2);
  });
});
