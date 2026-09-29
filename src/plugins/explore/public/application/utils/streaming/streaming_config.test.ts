/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capabilities } from '../../../../../../core/types';
import { STREAMING_RESULTS_SETTING } from '../../../../common';
import { findDateHistogramAggId, isStreamingEligible } from './streaming_config';

const OPENSEARCH = 'OpenSearch';
const ELASTICSEARCH = 'Elasticsearch';

const capabilitiesWith = (pplStreaming: unknown): Capabilities =>
  ({
    navLinks: {},
    management: {},
    catalogue: {},
    queryEnhancements: { pplStreaming },
  }) as unknown as Capabilities;

// Mirrors IUiSettingsClient.get's generic signature so the stub is assignable to it.
const uiSettingsWith = (enabled: unknown) => ({
  get: <T>(key: string, fallback?: T): T =>
    (key === STREAMING_RESULTS_SETTING ? enabled : fallback) as T,
});

const deps = (pplStreaming: unknown, settingEnabled: unknown = true) => ({
  uiSettings: uiSettingsWith(settingEnabled),
  capabilities: capabilitiesWith(pplStreaming),
});

const pplOn = { language: 'PPL', engineType: OPENSEARCH, datasetType: 'INDEX_PATTERN' };

describe('isStreamingEligible', () => {
  it('streams a PPL query on OpenSearch when the flag and the user setting are both on', () => {
    expect(isStreamingEligible(deps(true), pplOn)).toBe(true);
  });

  it('does not stream when the deployment flag is off, whatever the user set', () => {
    expect(isStreamingEligible(deps(false, true), pplOn)).toBe(false);
  });

  it('does not stream when the user has not opted in', () => {
    expect(isStreamingEligible(deps(true, false), pplOn)).toBe(false);
  });

  it.each(['SQL', 'PROMQL', 'kuery', 'lucene', undefined])(
    'does not stream %p, since the async API is a PPL endpoint',
    (language) => {
      expect(isStreamingEligible(deps(true), { ...pplOn, language })).toBe(false);
    }
  );

  describe('engine support', () => {
    // Legacy Elasticsearch serves SQL/PPL from the Open Distro endpoints, which have no async
    // equivalent, so there is nothing to stream from.
    it('does not stream on legacy Elasticsearch', () => {
      expect(isStreamingEligible(deps(true), { ...pplOn, engineType: ELASTICSEARCH })).toBe(false);
    });

    // Matching the rest of the engine capability table, which fails open. A wrong guess costs one
    // failed submit, which falls back to the non-streaming path.
    it.each([[undefined], ['Serverless'], ['AnalyticEngine'], ['something-new']])(
      'assumes the unmapped engine %p supports streaming',
      (engineType) => {
        expect(isStreamingEligible(deps(true), { ...pplOn, engineType })).toBe(true);
      }
    );
  });

  describe('dataset type', () => {
    it.each(['INDEX_PATTERN', 'INDEXES'])(
      'streams the index-backed dataset type %s',
      (datasetType) => {
        expect(isStreamingEligible(deps(true), { ...pplOn, datasetType })).toBe(true);
      }
    );

    // An S3 dataset routes to the pplasync strategy and its own job API, so streaming it through
    // /_plugins/_ppl would send the query somewhere else entirely.
    it('does not stream an S3 dataset, which has its own async path', () => {
      expect(isStreamingEligible(deps(true), { ...pplOn, datasetType: 'S3' })).toBe(false);
    });

    it('does not stream a Prometheus dataset', () => {
      expect(isStreamingEligible(deps(true), { ...pplOn, datasetType: 'PROMETHEUS' })).toBe(false);
    });

    // The allowlist is deliberate: an unrecognised type must not start streaming by default.
    it.each([[undefined], [''], ['SOMETHING_NEW']])(
      'does not stream the unrecognised dataset type %p',
      (datasetType) => {
        expect(isStreamingEligible(deps(true), { ...pplOn, datasetType })).toBe(false);
      }
    );
  });

  // Cross-cluster datasets are index-backed with an unmapped engine type, so they stream. Whether
  // the engine's async PPL API actually spans remote clusters is unverified; if it does not, the
  // submit fails and the query falls back to the non-streaming path.
  it('streams a cross-cluster dataset', () => {
    expect(
      isStreamingEligible(deps(true), {
        ...pplOn,
        engineType: 'OpenSearch(Cross-cluster search)',
      })
    ).toBe(true);
  });

  // Dynamic config writes are not schema-validated, so the capability can hold a non-boolean. The
  // string 'false' is truthy and must not enable streaming.
  it.each([['true'], ['false'], [1], [0], [null], [undefined], [{}]])(
    'treats the non-boolean capability %p as off',
    (pplStreaming) => {
      expect(isStreamingEligible(deps(pplStreaming), pplOn)).toBe(false);
    }
  );

  it('does not stream when the capability is absent entirely', () => {
    const capabilities = { navLinks: {}, management: {}, catalogue: {} } as unknown as Capabilities;
    expect(isStreamingEligible({ uiSettings: uiSettingsWith(true), capabilities }, pplOn)).toBe(
      false
    );
  });

  it('defaults the user setting to off when it has never been set', () => {
    const get = jest.fn(<T>(_key: string, fallback?: T): T => fallback as T);
    const uiSettings = { get };
    expect(isStreamingEligible({ uiSettings, capabilities: capabilitiesWith(true) }, pplOn)).toBe(
      false
    );
    expect(get).toHaveBeenCalledWith(STREAMING_RESULTS_SETTING, false);
  });
});

describe('findDateHistogramAggId', () => {
  it('finds the id of the date histogram aggregation', () => {
    expect(findDateHistogramAggId({ 1: { terms: {} }, 2: { date_histogram: {} } })).toBe('2');
  });

  it('has no id when no aggregation is a date histogram', () => {
    expect(findDateHistogramAggId({ 1: { terms: {} } })).toBeUndefined();
  });

  it.each([[undefined], [{}]])('has no id for %p', (aggs) => {
    expect(findDateHistogramAggId(aggs)).toBeUndefined();
  });
});
