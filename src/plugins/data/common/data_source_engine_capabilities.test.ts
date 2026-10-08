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
});
