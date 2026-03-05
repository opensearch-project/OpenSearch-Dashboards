/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ATNDeserializer } from 'antlr4ng';
import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { pplGrammarCache } from './ppl_grammar_cache';
import { PPLArtifactBundle } from './ppl_artifact_loader';

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

const createBundle = (grammarHash = 'sha256:test'): PPLArtifactBundle => ({
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

  it('should cache local backend version from /api/status', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue({ version: { number: '3.6.1' } }),
    } as unknown) as HttpSetup;

    const v1 = await pplGrammarCache.getBackendVersion(
      http,
      {} as SavedObjectsClientContract,
      undefined
    );
    const v2 = await pplGrammarCache.getBackendVersion(
      http,
      {} as SavedObjectsClientContract,
      undefined
    );

    expect(v1).toBe('3.6.1');
    expect(v2).toBe('3.6.1');
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith('/api/status');
  });

  it('should cache remote datasource backend version from saved object', async () => {
    const http = ({
      get: jest.fn(),
    } as unknown) as HttpSetup;
    const savedObjectsClient = ({
      get: jest.fn().mockResolvedValue({
        attributes: { dataSourceVersion: '3.7.0' },
      }),
    } as unknown) as SavedObjectsClientContract;

    const v1 = await pplGrammarCache.getBackendVersion(http, savedObjectsClient, 'ds-1');
    const v2 = await pplGrammarCache.getBackendVersion(http, savedObjectsClient, 'ds-1');

    expect(v1).toBe('3.7.0');
    expect(v2).toBe('3.7.0');
    expect(savedObjectsClient.get).toHaveBeenCalledTimes(1);
    expect(savedObjectsClient.get).toHaveBeenCalledWith('data-source', 'ds-1');
    expect(http.get).not.toHaveBeenCalled();
  });

  it('should deduplicate concurrent grammar fetches and cache successful result', async () => {
    let resolveFetch: (bundle: PPLArtifactBundle) => void;
    const fetchPromise = new Promise<PPLArtifactBundle>((resolve) => {
      resolveFetch = resolve;
    });

    const http = ({
      get: jest.fn().mockReturnValue(fetchPromise),
    } as unknown) as HttpSetup;

    const p1 = pplGrammarCache.getOrFetchGrammar(http, 'ds-1');
    const p2 = pplGrammarCache.getOrFetchGrammar(http, 'ds-1');

    expect(http.get).toHaveBeenCalledTimes(1);

    resolveFetch!(createBundle('sha256:dedupe'));

    const [g1, g2] = await Promise.all([p1, p2]);
    expect(g1).not.toBeNull();
    expect(g1).toBe(g2);
    expect(g1?.grammarHash).toBe('sha256:dedupe');

    const g3 = await pplGrammarCache.getOrFetchGrammar(http, 'ds-1');
    expect(g3).toBe(g1);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('should ignore symbolicNames slot 0 when building runtime token map', async () => {
    const bundle = createBundle('sha256:symbolic-zero');
    bundle.symbolicNames = ['INVALID_SLOT_ZERO', 'SOURCE', 'EQUAL'];

    const http = ({
      get: jest.fn().mockResolvedValue(bundle),
    } as unknown) as HttpSetup;

    const grammar = await pplGrammarCache.getOrFetchGrammar(http, 'ds-symbolic-zero');

    expect(grammar).not.toBeNull();
    expect(grammar?.runtimeSymbolicNameToTokenType.has('INVALID_SLOT_ZERO')).toBe(false);
    expect(grammar?.runtimeSymbolicNameToTokenType.get('SOURCE')).toBe(1);
  });

  it('should deserialize ATN with verification enabled', async () => {
    const verifyFlags: boolean[] = [];
    (ATNDeserializer.prototype.deserialize as jest.Mock).mockImplementation(function (this: unknown) {
      const options = (this as {
        deserializationOptions?: {
          verifyATN?: boolean;
        };
      }).deserializationOptions;
      verifyFlags.push(options?.verifyATN === true);
      return {} as ReturnType<ATNDeserializer['deserialize']>;
    });

    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:verify-atn')),
    } as unknown) as HttpSetup;

    const grammar = await pplGrammarCache.getOrFetchGrammar(http, 'ds-verify-atn');

    expect(grammar).not.toBeNull();
    expect(verifyFlags).toEqual([true, true]);
  });

  it('should keep datasource grammar caches isolated and invalidate only one datasource', async () => {
    const http = ({
      get: jest
        .fn()
        .mockImplementation((_path: string, options?: { query?: Record<string, string> }) => {
          const dsId = options?.query?.dataSourceId ?? 'default';
          return Promise.resolve(createBundle(`sha256:${dsId}`));
        }),
    } as unknown) as HttpSetup;

    const g1 = await pplGrammarCache.getOrFetchGrammar(http, 'ds-1');
    const g2 = await pplGrammarCache.getOrFetchGrammar(http, 'ds-2');

    expect(g1?.grammarHash).toBe('sha256:ds-1');
    expect(g2?.grammarHash).toBe('sha256:ds-2');

    pplGrammarCache.invalidate('ds-1');

    expect(pplGrammarCache.getCachedGrammar('ds-1')).toBeNull();
    expect(pplGrammarCache.getCachedGrammar('ds-2')?.grammarHash).toBe('sha256:ds-2');
  });

  it('should avoid repeated warm-up fetches after failure until invalidate', async () => {
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

    pplGrammarCache.invalidate('ds-fail');
    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-fail');
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

    const grammar = await pplGrammarCache.getOrFetchGrammar(http, 'ds-bad-atn');

    expect(grammar).toBeNull();
    expect(pplGrammarCache.getCachedGrammar('ds-bad-atn')).toBeNull();
  });

  it('should abort grammar fetch on timeout and return null', async () => {
    jest.useFakeTimers();
    try {
      const http = ({
        get: jest.fn().mockImplementation((_path: string, options?: { signal?: AbortSignal }) => {
          return new Promise((_resolve, reject) => {
            options?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          });
        }),
      } as unknown) as HttpSetup;

      const pending = pplGrammarCache.getOrFetchGrammar(http, 'ds-timeout');
      jest.advanceTimersByTime(10001);

      await expect(pending).resolves.toBeNull();
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(pplGrammarCache.getCachedGrammar('ds-timeout')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('should skip grammar fetch during warm-up when backend version is unsupported', async () => {
    const http = ({
      get: jest.fn(),
    } as unknown) as HttpSetup;
    const savedObjectsClient = ({
      get: jest.fn().mockResolvedValue({
        attributes: { dataSourceVersion: '3.5.9' },
      }),
    } as unknown) as SavedObjectsClientContract;

    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-unsupported');
    await flushPromises();

    expect(savedObjectsClient.get).toHaveBeenCalledTimes(1);
    expect(http.get).not.toHaveBeenCalled();
    expect(pplGrammarCache.getCachedGrammar('ds-unsupported')).toBeNull();
  });

  it('should skip grammar fetch when backend version lookup fails', async () => {
    const http = ({
      get: jest.fn(),
    } as unknown) as HttpSetup;
    const savedObjectsClient = ({
      get: jest.fn().mockRejectedValue(new Error('saved object unavailable')),
    } as unknown) as SavedObjectsClientContract;

    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-version-fail');
    await flushPromises();

    expect(savedObjectsClient.get).toHaveBeenCalledTimes(1);
    expect(http.get).not.toHaveBeenCalled();
    expect(pplGrammarCache.getCachedGrammar('ds-version-fail')).toBeNull();
  });

  it('should not retry version determination when datasource version is missing for the same datasource', async () => {
    const http = ({
      get: jest.fn(),
    } as unknown) as HttpSetup;
    const savedObjectsClient = ({
      get: jest.fn().mockResolvedValue({
        attributes: {},
      }),
    } as unknown) as SavedObjectsClientContract;

    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-no-version');
    await flushPromises();
    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-no-version');
    await flushPromises();

    expect(savedObjectsClient.get).toHaveBeenCalledTimes(1);
    expect(http.get).not.toHaveBeenCalled();
    expect(pplGrammarCache.getCachedGrammar('ds-no-version')).toBeNull();
  });

  it('should not retry version determination after datasource version 404 for the same datasource', async () => {
    const http = ({
      get: jest.fn(),
    } as unknown) as HttpSetup;
    const savedObjectsClient = ({
      get: jest.fn().mockRejectedValue(new Error('404')),
    } as unknown) as SavedObjectsClientContract;

    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-version-404');
    await flushPromises();
    pplGrammarCache.warmUp(http, savedObjectsClient, 'ds-version-404');
    await flushPromises();

    expect(savedObjectsClient.get).toHaveBeenCalledTimes(1);
    expect(http.get).not.toHaveBeenCalled();
    expect(pplGrammarCache.getCachedGrammar('ds-version-404')).toBeNull();
  });

  it('should use provided datasource version to gate warm-up without saved object lookup', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:provided-version')),
    } as unknown) as HttpSetup;

    pplGrammarCache.warmUp(http, undefined, 'ds-provided', '3.6.0');
    await flushPromises();

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith('/api/enhancements/ppl/grammar', {
      query: { dataSourceId: 'ds-provided' },
      signal: expect.any(AbortSignal),
    });
    expect(pplGrammarCache.getCachedGrammar('ds-provided')?.grammarHash).toBe(
      'sha256:provided-version'
    );
  });

  it('should skip grammar fetch for local cluster when /api/status reports unsupported version', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue({ version: { number: '3.5.0' } }),
    } as unknown) as HttpSetup;

    pplGrammarCache.warmUp(http, {} as SavedObjectsClientContract, undefined);
    await flushPromises();

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith('/api/status');
    expect(pplGrammarCache.getCachedGrammar(undefined)).toBeNull();
  });

  it('should deduplicate warm-up calls while fetches are pending', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:warmup')),
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

  it('should serve grammar from cache after warm-up without additional backend requests', async () => {
    const http = ({
      get: jest.fn().mockResolvedValue(createBundle('sha256:cache-hit')),
    } as unknown) as HttpSetup;

    pplGrammarCache.warmUp(http, undefined, 'ds-cache-hit', '3.6.0');
    await flushPromises();

    const cached1 = pplGrammarCache.getCachedGrammar('ds-cache-hit');
    const cached2 = pplGrammarCache.getCachedGrammar('ds-cache-hit');

    expect(cached1?.grammarHash).toBe('sha256:cache-hit');
    expect(cached2?.grammarHash).toBe('sha256:cache-hit');
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('should clear caches and allow refetch', async () => {
    const http = ({
      get: jest
        .fn()
        .mockResolvedValueOnce(createBundle('sha256:first'))
        .mockResolvedValueOnce(createBundle('sha256:second')),
    } as unknown) as HttpSetup;

    const first = await pplGrammarCache.getOrFetchGrammar(http, 'ds-1');
    expect(first?.grammarHash).toBe('sha256:first');
    expect(http.get).toHaveBeenCalledTimes(1);

    pplGrammarCache.clear();

    const second = await pplGrammarCache.getOrFetchGrammar(http, 'ds-1');
    expect(second?.grammarHash).toBe('sha256:second');
    expect(http.get).toHaveBeenCalledTimes(2);
  });
});
