/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DEFAULT_ENGINE_CAPABILITIES,
  getDataSourceEngineCapabilities,
} from './data_source_engine_capabilities';

describe('getDataSourceEngineCapabilities', () => {
  it('returns Elasticsearch capabilities (Open Distro, no span, no runtime grammar, min versions)', () => {
    const caps = getDataSourceEngineCapabilities('Elasticsearch');
    expect(caps.usesOpenDistroSqlPpl).toBe(true);
    expect(caps.supportsPplSpan).toBe(false);
    expect(caps.supportsRuntimePplGrammar).toBe(false);
    expect(caps.minLanguageVersions).toEqual({ SQL: '6.5.0', PPL: '7.9.0' });
    expect(caps.sqlPplEndpoints).toEqual({
      ppl: 'enhancements.pplQueryOpenDistro',
      sql: 'enhancements.sqlQueryOpenDistro',
    });
  });

  it('returns default capabilities for OpenSearch', () => {
    expect(getDataSourceEngineCapabilities('OpenSearch')).toEqual(DEFAULT_ENGINE_CAPABILITIES);
  });

  it.each([
    'OpenSearch Serverless',
    'AnalyticEngine',
    'OpenSearch(Cross-cluster search)',
    'No Engine Type Available',
    'SomethingUnknown',
  ])('fails open to default capabilities for unmapped engine %s', (engineType) => {
    expect(getDataSourceEngineCapabilities(engineType)).toEqual(DEFAULT_ENGINE_CAPABILITIES);
  });

  it('fails open to default capabilities when engine type is undefined', () => {
    const caps = getDataSourceEngineCapabilities(undefined);
    expect(caps).toEqual(DEFAULT_ENGINE_CAPABILITIES);
    expect(caps.usesOpenDistroSqlPpl).toBe(false);
    expect(caps.supportsPplSpan).toBe(true);
    expect(caps.supportsRuntimePplGrammar).toBe(true);
    expect(caps.minLanguageVersions).toBeUndefined();
  });

  describe('async PPL streaming', () => {
    it('is supported on OpenSearch', () => {
      expect(getDataSourceEngineCapabilities('OpenSearch').supportsAsyncPplStreaming).toBe(true);
    });

    it('is not supported on legacy Elasticsearch, which has no async endpoint', () => {
      expect(getDataSourceEngineCapabilities('Elasticsearch').supportsAsyncPplStreaming).toBe(
        false
      );
    });

    it.each([undefined, 'OpenSearch Serverless', 'AnalyticEngine', 'SomethingUnknown'])(
      'fails open for the unmapped engine %s',
      (engineType) => {
        expect(getDataSourceEngineCapabilities(engineType).supportsAsyncPplStreaming).toBe(true);
      }
    );

    // The async PPL API is only served from the `/_plugins/_ppl` endpoints, so claiming streaming
    // support on an Open Distro engine would always be wrong. Guards against a future engine entry
    // setting one without the other.
    it.each(['Elasticsearch', 'OpenSearch', 'SomethingUnknown', undefined])(
      'is never claimed alongside Open Distro endpoints, for %s',
      (engineType) => {
        const caps = getDataSourceEngineCapabilities(engineType);
        expect(caps.usesOpenDistroSqlPpl && caps.supportsAsyncPplStreaming).toBe(false);
      }
    );
  });
});
