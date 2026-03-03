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
    expect(pplGrammarCache.shouldFetchFromBackend('3.10.1')).toBe(true);
    expect(pplGrammarCache.shouldFetchFromBackend('4.0.0')).toBe(true);
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
